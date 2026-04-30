import { Platform } from 'react-native';

// Web browsers use localhost; physical mobile devices need the LAN IP
const LAN_IP = '192.168.1.183';
export const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:5001/api'
    : `http://${LAN_IP}:5001/api`;
