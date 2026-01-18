import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e8f6ff',
    100: '#cfeefe',
    500: '#2563eb', // primary
  },
};

const fonts = {
  heading: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  body: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
};

const theme = extendTheme({ config, colors, fonts });

export default theme;