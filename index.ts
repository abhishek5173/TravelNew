import messaging from '@react-native-firebase/messaging';
import 'expo-router/entry'; // keep this first

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});
