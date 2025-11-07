import React, { useState, useEffect } from 'react';
import { Box, Container, CssBaseline, Grid, Typography, useMediaQuery } from '@mui/material';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import Search from './components/Search/Search';
import WeeklyForecast from './components/WeeklyForecast/WeeklyForecast';
import TodayWeather from './components/TodayWeather/TodayWeather';
import { fetchWeatherData } from './api/OpenWeatherService';
import { transformDateFormat } from './utilities/DatetimeUtils';
import UTCDatetime from './components/Reusable/UTCDatetime';
import LoadingBox from './components/Reusable/LoadingBox';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbCloudyIcon from '@mui/icons-material/Cloud';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import GrainIcon from '@mui/icons-material/Grain';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { keyframes } from '@emotion/react';
import ErrorBox from './components/Reusable/ErrorBox';
import { ALL_DESCRIPTIONS } from './utilities/DateConstants';
import { getTodayForecastWeather, getWeekForecastWeather } from './utilities/DataUtils';

// Animation keyframes
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.8; transform: scale(1); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Create a theme instance
let theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3436',
      secondary: '#636e72',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

function App() {
  const [todayWeather, setTodayWeather] = useState(null);
  const [todayForecast, setTodayForecast] = useState([]);
  const [weekForecast, setWeekForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getWeatherIcon = (weatherData) => {
    if (!weatherData) {
      return (
        <WbSunnyIcon 
          sx={{
            fontSize: isMobile ? '120px' : '180px',
            color: '#ffc107',
            mb: 3,
            opacity: 0.9,
            animation: `${pulse} 3s ease-in-out infinite`,
          }}
        />
      );
    }

    const weatherMain = weatherData.main.toLowerCase();
    const weatherDescription = weatherData.description.toLowerCase();
    const iconStyle = {
      fontSize: isMobile ? '120px' : '180px',
      mb: 3,
      animation: `${float} 6s ease-in-out infinite`,
    };

    if (weatherMain.includes('clear')) {
      return <WbSunnyIcon sx={{ ...iconStyle, color: '#ffc107' }} />;
    } else if (weatherMain.includes('thunder') || weatherDescription.includes('thunder')) {
      return <ThunderstormIcon sx={{ ...iconStyle, color: '#9c27b0' }} />;
    } else if (weatherMain.includes('snow') || weatherDescription.includes('snow')) {
      return <AcUnitIcon sx={{ ...iconStyle, color: '#90caf9', animation: `${spin} 20s linear infinite` }} />;
    } else if (weatherMain.includes('rain') || weatherDescription.includes('rain')) {
      return <WaterDropIcon sx={{ ...iconStyle, color: '#2196f3' }} />;
    } else if (weatherMain.includes('drizzle')) {
      return <GrainIcon sx={{ ...iconStyle, color: '#64b5f6' }} />;
    } else if (weatherMain.includes('mist') || weatherMain.includes('fog') || weatherMain.includes('haze')) {
      return <CloudQueueIcon sx={{ ...iconStyle, color: '#bdbdbd' }} />;
    } else if (weatherMain.includes('clouds')) {
      if (weatherDescription.includes('few') || weatherDescription.includes('scattered')) {
        return <WbTwilightIcon sx={{ ...iconStyle, color: '#90caf9' }} />;
      }
      return <WbCloudyIcon sx={{ ...iconStyle, color: '#90a4ae' }} />;
    }
    
    // Default icon
    return <WbSunnyIcon sx={{ ...iconStyle, color: '#ffc107' }} />;
  };
  
  // Auto-fetch weather for a default location (e.g., New York) on initial load
  useEffect(() => {
    const defaultLocation = {
      value: '40.7128 -74.0060',
      label: 'New York, US'
    };
    searchChangeHandler(defaultLocation);
  }, []);

  const searchChangeHandler = async (enteredData) => {
    const [latitude, longitude] = enteredData.value.split(' ');

    setIsLoading(true);

    const currentDate = transformDateFormat();
    const date = new Date();
    let dt_now = Math.floor(date.getTime() / 1000);

    try {
      const [todayWeatherResponse, weekForecastResponse] =
        await fetchWeatherData(latitude, longitude);
      const all_today_forecasts_list = getTodayForecastWeather(
        weekForecastResponse,
        currentDate,
        dt_now
      );

      const all_week_forecasts_list = getWeekForecastWeather(
        weekForecastResponse,
        ALL_DESCRIPTIONS
      );

      setTodayForecast([...all_today_forecasts_list]);
      setTodayWeather({ city: enteredData.label, ...todayWeatherResponse });
      setWeekForecast({
        city: enteredData.label,
        list: all_week_forecasts_list,
      });
    } catch (error) {
      setError(true);
    }

    setIsLoading(false);
  };

  let appContent = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        width: '100%',
        minHeight: '70vh',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        borderRadius: 4,
        p: 4,
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      }}
    >
      {getWeatherIcon(todayWeather?.weather?.[0])}
      
      {todayWeather?.weather?.[0]?.main && (
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
            mb: 2,
            textTransform: 'capitalize',
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          {todayWeather?.weather?.[0]?.description}
        </Typography>
      )}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 2,
          fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
          lineHeight: 1.2,
        }}
      >
        Weather Forecast
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{
          color: 'text.secondary',
          maxWidth: '600px',
          mb: 4,
          fontSize: { xs: '0.9rem', sm: '1rem' },
          lineHeight: 1.6,
        }}
      >
        Get accurate weather forecasts for over 200,000 cities worldwide.
        Search for a location to see current conditions and a detailed 6-day forecast.
      </Typography>
    </Box>
  );

  if (todayWeather && todayForecast && weekForecast) {
    appContent = (
      <React.Fragment>
        <Grid item xs={12} md={todayWeather ? 6 : 12}>
          <Grid item xs={12}>
            <TodayWeather data={todayWeather} forecastList={todayForecast} />
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <WeeklyForecast data={weekForecast} />
        </Grid>
      </React.Fragment>
    );
  }

  if (error) {
    appContent = (
      <ErrorBox
        margin="3rem auto"
        flex="inherit"
        errorMessage="Something went wrong"
      />
    );
  }

  if (isLoading) {
    appContent = (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '500px',
        }}
      >
        <LoadingBox value="1">
          <Typography
            variant="h3"
            component="h3"
            sx={{
              fontSize: { xs: '10px', sm: '12px' },
              color: 'rgba(255, 255, 255, .8)',
              lineHeight: 1,
              fontFamily: 'Poppins',
            }}
          >
            Loading...
          </Typography>
        </LoadingBox>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a1929 0%, #1a3a5a 50%, #0a1929 100%)',
          py: { xs: 2, md: 4 },
          transition: 'background 0.5s ease-in-out',
          color: '#ffffff',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, md: 3 },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              mb: 4,
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  mb: 0.5,
                }}
              >
                Weather Forecast
              </Typography>
              <UTCDatetime />
            </Box>
            <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '400px' } }}>
              <Search onSearchChange={searchChangeHandler} />
            </Box>
          </Box>

          {/* Loading State */}
          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
              }}
            >
              <LoadingBox>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.primary',
                    textAlign: 'center',
                    fontWeight: 500,
                  }}
                >
                  Fetching weather data...
                </Typography>
              </LoadingBox>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Box sx={{ my: 4 }}>
              <ErrorBox
                margin="2rem auto"
                flex="inherit"
                errorMessage="Unable to fetch weather data. Please try again later."
              />
            </Box>
          )}

          {/* Main Content */}
          {!isLoading && !error && (
            <Box
              sx={{
                opacity: isLoading ? 0.7 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
            >
              {appContent}
            </Box>
          )}
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 6,
            py: 3,
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} Weather Forecast App
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
