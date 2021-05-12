import PropTypes from 'prop-types';
import React from 'react';
import { Text, Dimensions, View } from 'react-native';
import Modal from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Button } from 'react-native-elements';

function ActionResultAlert(route) {
	ActionResultAlert.propTypes = {
		positive: PropTypes.bool,
		customMessage: PropTypes.string,
		customTitle: PropTypes.string,
		onRequestClose: PropTypes.func.isRequired,
		isVisible: PropTypes.bool.isRequired,
		dataSource: PropTypes.object,
		onModalHide: PropTypes.func
	};

	const { positive, customMessage, customTitle, onRequestClose, isVisible, dataSource, onModalHide } = route;
	return (
		<Modal
			animationType="slide"
			backdropColor={'black'}
			backdropOpacity={0.7}
			isVisible={isVisible}
			onRequestClose={onRequestClose}
			onBackdropPress={onRequestClose}
			onModalHide={onModalHide}
		>
			<View
				style={{
					marginTop: 22,
					backgroundColor: 'white',
					alignSelf: 'center',
					height: 350,
					borderRadius: 20,
					shadowRadius: 5,
					shadowOffset: {
						width: 0,
						height: 0,
					},
					shadowColor: '#000000',
					shadowOpacity: 0.70,
					elevation: 5,
					width: Dimensions.get('screen').width - 40
				}}
			>

				<View style={{ borderRadius: 20 }}>
					<LinearGradient
						colors={[
							'rgb(255,187,0)',
							'white'
						]}
						start={{ x: 0.5, y: 0.9 }}
						end={{ x: 0.5, y: 0.4 }}
						style={{
							height: '100%',
							width: '100%',
							paddingLeft: 10,
							paddingRight: 10,
							paddingBottom:
								dataSource
									.Locatie !== '' ||
									dataSource
										.Plaatsnaam !== ''
									? Dimensions.get('window')
										.width < 340
										? 0
										: 30
									: 30,
							borderRadius: 20,
						}}
					>
						<View style={{ alignItems: 'center' }}>
							<Icon
								onPress={onRequestClose}
								name="cross"
								type="entypo"
								color="black"
								containerStyle={{
									width: 30,
									alignSelf: 'flex-end',
									marginTop: 10,
									marginRight: 0
								}}
							/>
							<Icon
								name={positive ? "smile-o" : "frown-o"}
								size={150}
								color={'black'}
								type={'font-awesome'}
								style={{
									alignContent: 'center',
									textAlign: 'center'
								}}
							/>
							<Text style={{ color: 'black', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>
								{customTitle}
							</Text>
							<Text style={{ color: 'black', fontSize: 16, textAlign: 'center' }}>
								{customMessage}
							</Text>
							<View
								style={{
									flexDirection: 'row',
									width:
										Dimensions.get('screen')
											.width - 160,
									alignSelf: 'center',
									alignContent: 'center',
									justifyContent: 'center'

								}}
							>
								<Button
									title={'Sluit'}
									onPress={onRequestClose}
									titleStyle={{
										fontSize:
											Dimensions.get('screen')
												.width < 370
												? 17
												: 19,
										color: 'white',
										marginTop: -4
									}}
									buttonStyle={{
										backgroundColor: 'black',
										borderRadius: 5,
										height: 40,
										marginTop: positive ? 2 : 15,
										paddingLeft: 20,
										paddingRight: 20
									}}
								/>
							</View>
						</View>
					</LinearGradient>
				</View>

			</View>
		</Modal>
	)
}
export default ActionResultAlert;
