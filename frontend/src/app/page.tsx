import { Container, Box } from '@mui/material';
import EventSearchForm from '@/components/EventSearchForm';

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FEF7FF 0%, #F3E5F5 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <EventSearchForm />
      </Container>
    </Box>
  );
}
