import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_KEY='alqadi-device-id';
export async function getDeviceId():Promise<string>{
 let id=await AsyncStorage.getItem(DEVICE_KEY);
 if(!id){id='dev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);await AsyncStorage.setItem(DEVICE_KEY,id)}
 return id;
}
