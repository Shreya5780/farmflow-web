import { Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Button, Box } from '@mui/material'

const NotFoundPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
        404 — Page not found
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        The page you are looking for does not exist. Use the navigation above to return to the dashboard.
      </Typography>
      <Box>
        <Button component={RouterLink} to="/" variant="contained" color="primary">
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  )
}

export default NotFoundPage
