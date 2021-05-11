import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import RetryIcon from 'react-native-vector-icons/MaterialIcons';
import FrownIcon from 'react-native-vector-icons/FontAwesome';

class ErrorMessage extends Component {
	static propTypes = {
		onPress: PropTypes.func,
		retryMessage: PropTypes.bool.isRequired,
		customMessage: PropTypes.string,
		customClosingMessage: PropTypes.string,
		retryButton: PropTypes.bool,
	};
	render = () => {
		const { onPress, retryMessage, customMessage, customClosingMessage, retryButton } = this.props;
		return (
			<View
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'black',
					flex: 1
				}}
			>
				<FrownIcon
					name='frown-o'
					size={140}
					color={'white'}
					style={{
						alignContent: 'center',
						textAlign: 'center',
						color: 'white'
					}}
				/>
				<Text style={{ color: 'white', fontSize: 20, textAlign: 'center', fontWeight: 'bold', marginTop: 20 }}>
					{'Helaas!'}
				</Text>
				<Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
					{customMessage
						? customMessage
						: retryMessage
							? 'Er ging iets mis. \n Probeer het opnieuw met de onderstaande knop'
							: 'Dit apparaat is offline. \n Controleer je internet verbinding'}
				</Text>
				{customClosingMessage !== '' ?
					<Text style={{ color: 'white', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
						{customClosingMessage}
					</Text>
					: null}
				{retryMessage || retryButton ? (
					<TouchableOpacity
						style={{ alignSelf: 'center', marginTop: 10 }}
						onPress={onPress}
					>
						<RetryIcon name='refresh' size={30} color={'white'} />
					</TouchableOpacity>
				) : null}
			</View>
		);
	};
}
export default ErrorMessage;
