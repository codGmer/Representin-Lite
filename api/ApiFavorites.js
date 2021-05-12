import OfflineFirstAPI from 'react-native-offline-api';
import ReportError from './ReportError';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_OPTIONS = {
	domains: { default: 'https://representin.nl' },
	prefixes: { default: '' },
	debugAPI: false,
	printNetworkRequests: false
};

const API_SERVICES = {
	getAllFavorites: {
		method: 'POST',
		path: 'index.php',
		disableCache: true
	},
	updateFavorites: {
		method: 'POST',
		path: 'index.php',
		disableCache: true
	},
	userFavorites: {
		method: 'POST',
		path: 'index.php',
		disableCache: true
	}
};

const api = new OfflineFirstAPI(API_OPTIONS, API_SERVICES);

export default class ApiFavorites {
	static async _getAllFavorites() {
		try {
			let userData = await SecureStore.getItemAsync('userData');
			let userID = JSON.parse(userData);
			let favoriteList = await api.fetch('getAllFavorites', {
				fetchOptions: {
					body: JSON.stringify({
						action: 'getFavorites',
						userID: userID.UserID
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
			if (favoriteList) {
				for (var i = 0; i < favoriteList.length; i++) {
					favoriteList = favoriteList[i];
				}
				await AsyncStorage.setItem(
					'Favorites',
					JSON.stringify(favoriteList)
				);
			} else {
				await AsyncStorage.setItem('Favorites', JSON.stringify(''));
			}
			return favoriteList;
		} catch (err) {
			console.log(err);
			await AsyncStorage.setItem('Favorites', JSON.stringify(''));
			ReportError._reportError(1000, err.toString(), false);
			return '0';
		}
	}

	static async _updateFavorite(favoriteItem) {
		try {
			let userData = await SecureStore.getItemAsync('userData');
			let userID = JSON.parse(userData);
			let response = await api.fetch('updateFavorites', {
				fetchOptions: {
					body: JSON.stringify({
						action: 'updateFavorites',
						userID: userID.UserID,
						favoriteItem: favoriteItem
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
			return response;
		} catch (error) {
			console.log(error);
			ReportError._reportError(980, error.toString());
			return '0';
		}
	}

	static async _getFavoriteScreenItems() {
		try {
			let userData = await SecureStore.getItemAsync('userData');
			let userID = JSON.parse(userData);
			let favoriteList = await api.fetch('userFavorites', {
				fetchOptions: {
					body: JSON.stringify({
						action: 'getFavoriteScreenItems',
						userID: userID.UserID
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
			return favoriteList;
		} catch (err) {
			console.log(err);
			await AsyncStorage.setItem('Favorites', JSON.stringify(''));
			ReportError._reportError(1005, err.toString());
			return '0';
		}
	}
}
