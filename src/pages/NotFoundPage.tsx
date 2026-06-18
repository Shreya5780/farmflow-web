import { Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Button, Box } from '@mui/material'
import { useTranslation } from 'react-i18next'

const NotFoundPage = () => {
  const { t } = useTranslation()
  return (
    <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 800 }}>
        {t('notFound.title')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        {t('notFound.desc')}
      </Typography>
      <Box>
        <Button component={RouterLink} to="/" variant="contained" color="primary">
          {t('notFound.back')}
        </Button>
      </Box>
    </Container>
  )
}

export default NotFoundPage
