'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AttachMoney as PriceIcon,
  Description as DescriptionIcon,
  Launch as LaunchIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { EventSearchRequest, EventSearchResponse, Event } from '@/types/events';
import { searchEvents } from '@/utils/api';

export default function EventSearchForm() {
  const [formData, setFormData] = useState<EventSearchRequest>({
    location: '',
    genre: '',
    startDateTime: '',
    endDateTime: '',
  });
  
  const [searchResults, setSearchResults] = useState<EventSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateValidationState, setDateValidationState] = useState<{
    startValid: boolean | null;
    endValid: boolean | null;
  }>({ startValid: null, endValid: null });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    
    // Real-time date validation
    if (name === 'startDateTime' || name === 'endDateTime') {
      validateDates(name === 'startDateTime' ? value : formData.startDateTime, 
                   name === 'endDateTime' ? value : formData.endDateTime);
    }
  };

  const validateDates = (startDateTime: string, endDateTime: string) => {
    // Reset validation state
    setDateValidationState({ startValid: null, endValid: null });
    
    // Only validate if both dates are provided
    if (!startDateTime || !endDateTime) {
      return;
    }

    const now = new Date();
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    let isValid = true;

    // Check if start date is in the past
    if (start <= now) {
      setError('The start date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setDateValidationState({ startValid: false, endValid: null });
      isValid = false;
      return;
    }

    // Check if end date is in the past
    if (end <= now) {
      setError('The end date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setDateValidationState({ startValid: true, endValid: false });
      isValid = false;
      return;
    }

    // Check if end is before start
    if (end <= start) {
      setError('The end date and time must be after the start date and time. Please check your date selection.');
      setDateValidationState({ startValid: true, endValid: false });
      isValid = false;
      return;
    }

    // If we get here, dates are valid
    if (isValid) {
      setDateValidationState({ startValid: true, endValid: true });
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.location.trim()) {
      setError('Please enter a location');
      setIsLoading(false);
      return;
    }

    if (!formData.genre.trim()) {
      setError('Please enter an event type');
      setIsLoading(false);
      return;
    }

    if (!formData.startDateTime || !formData.endDateTime) {
      setError('Please select both start and end dates');
      setIsLoading(false);
      return;
    }

    // Validate dates
    const now = new Date();
    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);

    if (start <= now) {
      setError('The start date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setIsLoading(false);
      return;
    }

    if (end <= now) {
      setError('The end date and time must be in the future. Please select a date and time that hasn\'t passed yet.');
      setIsLoading(false);
      return;
    }

    if (end <= start) {
      setError('The end date and time must be after the start date and time. Please check your date selection.');
      setIsLoading(false);
      return;
    }

    // Check if the date range is reasonable (not more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (start > oneYearFromNow || end > oneYearFromNow) {
      setError('Please select dates within the next year for better event availability.');
      setIsLoading(false);
      return;
    }

    // Check if the date range is too long (more than 6 months)
    const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000; // Approximate
    if (end.getTime() - start.getTime() > sixMonthsInMs) {
      setError('Please select a date range of 6 months or less for better results.');
      setIsLoading(false);
      return;
    }

    try {
      const results = await searchEvents(formData);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search events');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const downloadICAL = () => {
    if (!searchResults?.icalContent) {
      setError('No calendar data available for download');
      return;
    }

    try {
      let icalContent = searchResults.icalContent;
      
      // Validate iCal content and create fallback if needed
      if (!icalContent.includes('BEGIN:VCALENDAR') || !icalContent.includes('END:VCALENDAR')) {
        console.warn('Invalid iCal content detected, creating fallback from events data');
        
        // Generate proper iCal content from the events array as fallback
        if (searchResults.events && Array.isArray(searchResults.events) && searchResults.events.length > 0) {
          const escapeICalText = (text: string) => {
            return text
              .replace(/\\/g, '\\\\')
              .replace(/;/g, '\\;')
              .replace(/,/g, '\\,')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '');
          };

          icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Events App//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Events for ${searchResults.location}${searchResults.genre ? ` - ${searchResults.genre}` : ''}`;

          searchResults.events.forEach((event, index) => {
            const eventDate = new Date(event.date);
            const dtStart = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
            const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour later
            const dtEnd = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
            const uid = `event-${Date.now()}-${index}@events-app`;
            const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');

            icalContent += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${escapeICalText(event.name)}
DESCRIPTION:${escapeICalText(event.description || 'Event details')}
LOCATION:${escapeICalText(event.location || event.venue || '')}${event.url ? `
URL:${event.url}` : ''}
END:VEVENT`;
          });

          icalContent += `
END:VCALENDAR`;
        } else {
          setError('No valid events data available for download');
          return;
        }
      }

      // Create blob with ICAL content
      const blob = new Blob([icalContent], { 
        type: 'text/calendar;charset=utf-8' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const location = searchResults.location.toLowerCase().replace(/\s+/g, '-');
      const genre = searchResults.genre ? `-${searchResults.genre.toLowerCase()}` : '';
      const date = new Date().toISOString().split('T')[0];
      link.download = `events-${location}${genre}-${date}.ics`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ICAL file:', error);
      setError('Failed to download calendar file');
    }
  };

  const downloadIndividualEvent = (event: Event, index: number) => {
    try {
      // Generate ICAL content for individual event
      const eventDate = new Date(event.date);
      const dtStart = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      
      // Calculate end time (default to 1 hour later if no specific end time)
      const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour later
      const dtEnd = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      
      const uid = `event-${Date.now()}-${index}@events-app`;
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      
      // Escape ICAL text (replace newlines and special characters)
      const escapeICalText = (text: string) => {
        return text
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '');
      };

      const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Events App//Individual Event//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${escapeICalText(event.name)}
DESCRIPTION:${escapeICalText(event.description || 'Event details')}
LOCATION:${escapeICalText(event.location || event.venue || '')}${event.url ? `
URL:${event.url}` : ''}
END:VEVENT
END:VCALENDAR`;

      // Create blob and download
      const blob = new Blob([icalContent], { 
        type: 'text/calendar;charset=utf-8' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename for individual event
      const eventName = event.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .substring(0, 50); // Limit length
      const eventDateStr = eventDate.toISOString().split('T')[0];
      link.download = `${eventName}-${eventDateStr}.ics`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading individual event:', error);
      setError('Failed to download event file');
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
            Find Amazing Events
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Stack spacing={3}>
              {/* Location and Event Type Row */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, San Francisco, London"
                  required
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  helperText="Where are you located?"
                />
                <TextField
                  fullWidth
                  label="Event Type"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  placeholder="e.g., music, sports, theater, comedy, art, food"
                  required
                  InputProps={{
                    startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  helperText="What sort of event would you like to partake in?"
                />
              </Box>

              {/* Date Range Row */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  label="Start Date & Time Range"
                  name="startDateTime"
                  type="datetime-local"
                  value={formData.startDateTime}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{ shrink: true }}
                  color={dateValidationState.startValid === false ? 'error' : 
                         dateValidationState.startValid === true ? 'success' : 'primary'}
                  InputProps={{
                    endAdornment: dateValidationState.startValid === true && (
                      <CheckIcon sx={{ color: 'success.main' }} />
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="End Date & Time Range"
                  name="endDateTime"
                  type="datetime-local"
                  value={formData.endDateTime}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{ shrink: true }}
                  color={dateValidationState.endValid === false ? 'error' : 
                         dateValidationState.endValid === true ? 'success' : 'primary'}
                  InputProps={{
                    endAdornment: dateValidationState.endValid === true && (
                      <CheckIcon sx={{ color: 'success.main' }} />
                    ),
                  }}
                />
              </Box>

              {/* Helpful Tips */}
              {!formData.startDateTime || !formData.endDateTime ? (
                <Alert severity="info" icon={<InfoIcon />}>
                  <AlertTitle>Date Selection Tips</AlertTitle>
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemText primary="• Select dates in the future for upcoming events" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primary="• Keep the date range under 6 months for best results" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primary="• End date must be after the start date" />
                    </ListItem>
                  </List>
                </Alert>
              ) : null}

              {/* Error Message */}
              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ py: 1.5 }}
              >
                {isLoading ? 'Searching...' : 'Find Events'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                Events in {searchResults.location}
              </Typography>
              
              {/* Download All Button */}
              {Array.isArray(searchResults.events) && searchResults.events.length > 0 && (
                <Tooltip title="Download all events as calendar file">
                  <Fab
                    color="secondary"
                    size="medium"
                    onClick={downloadICAL}
                    sx={{ ml: 2 }}
                  >
                    <GetAppIcon />
                  </Fab>
                </Tooltip>
              )}
            </Box>
            
            {!Array.isArray(searchResults.events) || searchResults.events.length === 0 ? (
              <Paper elevation={1} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No events found for your search criteria.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your location, event type, or date range.
                </Typography>
                {!Array.isArray(searchResults.events) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <AlertTitle>Debug Info</AlertTitle>
                    Events data is not in expected format. 
                    {typeof searchResults.events === 'string' ? 'Received string instead of array.' : `Received ${typeof searchResults.events}.`}
                  </Alert>
                )}
              </Paper>
            ) : (
              <Stack spacing={3}>
                {searchResults.events.map((event: Event, index: number) => (
                  <Card key={index} variant="outlined" sx={{ position: 'relative' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ flex: 1, pr: 2 }}>
                          {event.name}
                        </Typography>
                        
                        <Tooltip title="Download this event">
                          <IconButton
                            size="small"
                            onClick={() => downloadIndividualEvent(event, index)}
                            sx={{ color: 'primary.main' }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        {event.date && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'small' }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Date:</strong> {formatDate(event.date)}
                            </Typography>
                          </Box>
                        )}
                        {event.time && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'small' }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Time:</strong> {event.time}
                            </Typography>
                          </Box>
                        )}
                        {event.venue && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'small' }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Venue:</strong> {event.venue}
                            </Typography>
                          </Box>
                        )}
                        {event.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'small' }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Location:</strong> {event.location}
                            </Typography>
                          </Box>
                        )}
                        {event.price && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PriceIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'small' }} />
                            <Chip
                              label={event.price}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Box>
                      
                      {event.description && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <DescriptionIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary', fontSize: 'small' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                Description
                              </Typography>
                              <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                                {event.description}
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      )}
                      
                      {event.url && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<LaunchIcon />}
                          >
                            View Event Details
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 