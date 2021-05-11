import OfflineFirstAPI from 'react-native-offline-api';
import ReportError from '../api/ReportError';

const API_OPTIONS = {
	domains: { default: 'https://representin.nl' },
	prefixes: { default: '' },
	debugAPI: false,
	printNetworkRequests: false
};

const API_LOCATION_OPTIONS = {
	domains: { default: 'http://json.api-postcode.nl' },
	prefixes: { default: '' },
	debugAPI: false,
	printNetworkRequests: false
};

const API_LOCATION_SERVICES = {
	AddressInfo: {
		method: 'GET',
		expiration: 10000,
		path: ''
	}
};

const API_SERVICES = {
	FetchRequest: {
		method: 'POST',
		path: '',
		disableCache: true
	},
};

const api = new OfflineFirstAPI(API_OPTIONS, API_SERVICES);
const apiAddress = new OfflineFirstAPI(
	API_LOCATION_OPTIONS,
	API_LOCATION_SERVICES
);

export default class GetApiListData {

	static async _fetchRequest(body, errorReport, errorCode) {
		try {
			let response = await api.fetch('FetchRequest', {
				fetchOptions: {
					body: JSON.stringify(body)
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
		} catch (err) {
			console.log(body)
			console.log(err + ' FetchRequest');
			if (typeof errorReport === 'undefined' || errorReport === true) {
				ReportError._reportError(errorCode, body.action + ' _fetchRequest' + ' ' + err.toString(), true);
			}
			return '0';
		}
	}

	static async _getAddressInfo(postcode, number) {
		try {
			let response = await apiAddress.fetch('AddressInfo', {
				queryParameters: {
					postcode,
					number
				},
				headers: {
					token: ''
				}
			});
			if (response[0]) {
				return response[0];
			} else {
				return response;
			}
		} catch (err) {
			console.log(err + ' AddressInfo');
			ReportError._reportError(1060, err.toString());
			return '0';
		}
	}
}
