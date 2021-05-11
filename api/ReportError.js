import { Alert, Platform } from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import OfflineFirstAPI from 'react-native-offline-api';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_OPTIONS = {
	domains: { default: 'http://representin.nl' },
	prefixes: { default: '' },
	debugAPI: false,
	printNetworkRequests: false
};

const API_SERVICES = {
	reportError: {
		method: 'POST',
		path: 'index.php',
		disableCache: true
	}
};

const api = new OfflineFirstAPI(API_OPTIONS, API_SERVICES);

export default class ReportError {
	static async _reportError(errorCode, errorMessage, alertUser) {
		try {
			let userData = await SecureStore.getItemAsync('userData');
			let userID = JSON.parse(userData);
			let netInfo = await NetInfo.fetch();
			await api.fetch('reportError', {
				fetchOptions: {
					body: JSON.stringify({
						action: 'reportError',
						userID: userID ? userID.UserID : -1,
						deviceName:
							Platform.OS === 'ios'
								? Constants.platform.ios.model
								: Constants.deviceName,
						nativeAppVersion: Constants.nativeAppVersion
							? Constants.nativeAppVersion
							: 0,
						nativeBuildVersion: Constants.nativeBuildVersion,
						netInfo: netInfo.type,
						osVersion: Platform.Version,
						platform: Platform.OS,
						errorCode: errorCode,
						errorMessage: errorMessage.toString()
					})
				},
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json;charset=utf-8',
					'Access-Control-Allow-Origin': 'https://representin.nl/',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Max-Age': '3600',
					'Access-Control-Allow-Headers':
						'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
				}
			});
			if (alertUser !== false) {
				Alert.alert(
					'Oops',
					'Er ging iets mis, mocht je dit probleem blijven ondervinden neem dan contact met ons op via onze website.'
				);
			}
			console.log(errorMessage);
		} catch (err) {
			console.log(err);
		}
	}
}
