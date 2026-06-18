import { Container, Paper, Typography, Box } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'
import { useTranslation } from 'react-i18next'

const ComingSoonPage = ({ titleKey }: { titleKey: string }) => {
  const { t } = useTranslation()
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            color: 'primary.main',
          }}
        >
          <ConstructionIcon fontSize="large" />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {t(titleKey)}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('comingSoon.desc')}
        </Typography>
      </Paper>
    </Container>
  )
}

export default ComingSoonPage
