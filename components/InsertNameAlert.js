import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Text, Dimensions, View, TextInput } from 'react-native';
import Modal from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Button } from 'react-native-elements';

class InsertNameModal extends Component {
	static propTypes = {
		customTitle: PropTypes.string,
		onRequestClose: PropTypes.func.isRequired,
		firstName: PropTypes.string,
		lastName: PropTypes.string,
		isVisible: PropTypes.bool.isRequired,
		saveFunc: PropTypes.func.isRequired,
		saveFirstNameChange: PropTypes.func.isRequired,
		saveLastNameChange: PropTypes.func.isRequired,
		onModalHide: PropTypes.func
	};
	render = () => {
		const { customTitle, onRequestClose, firstName, lastName, isVisible, saveFunc, saveFirstNameChange, saveLastNameChange, onModalHide } = this.props;
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
									30,
								borderRadius: 20,
							}}
						>
							<View style={{ flex: 1 }}>
								<View
									style={{
										alignItems: 'center',
										flex: 1
									}}
								>
									<Icon
										onPress={onRequestClose
										}
										name="cross"
										type="entypo"
										color="black"
										containerStyle={{
											width: 30,
											alignSelf: 'flex-end',
											marginTop: 10
										}}
									/>
									<View
										style={{
											alignItems: 'center',
											flexDirection: 'column',
											marginTop: 10,
											width:
												Dimensions.get('screen')
													.width - 50,
											flex: 1
										}}
									>
										<Text
											style={{
												fontSize: 17,
												marginBottom: 0,
												color: 'black',
												textAlign: 'center',
												fontWeight: "bold"
											}}
										>
											{customTitle}
										</Text>
										<View
											style={{
												flexDirection: 'column',
												width: '80%',
												alignItems: 'center'
											}}
										>
											<View
												style={{
													flexDirection: 'column',
													width: '80%',
													marginTop: 15
												}}
											>
												<Text
													style={{
														fontSize: 15,
														marginBottom: 5,
														color: 'grey',
														fontWeight: "bold"
													}}
												>
													Voornaam
													</Text>
												<TextInput
													style={{
														borderWidth: 1,
														paddingLeft: 10,
														paddingRight: 10,
														paddingTop: 5,
														paddingBottom: 5,
														fontSize: 18,
														fontWeight: 'bold',
														borderRadius: 3,
														width: '100%',
														borderColor:
															'rgb(255,187,0)',
														backgroundColor: 'rgba(255,255,255, 0.3)'
													}}
													value={firstName}
													onChangeText={FirstName => saveFirstNameChange(FirstName)}
												/>
											</View>
											<View
												style={{
													flexDirection: 'column',
													width: '80%'
												}}
											>
												<Text
													style={{
														fontSize: 15,
														marginTop: 10,
														marginBottom: 5,
														color: 'grey',
														fontWeight: "bold"
													}}
												>
													Achternaam
													</Text>
												<TextInput
													style={{
														borderWidth: 1,
														paddingLeft: 10,
														paddingRight: 10,
														paddingTop: 5,
														paddingBottom: 5,
														fontSize: 18,
														fontWeight: 'bold',
														borderRadius: 3,
														width: '100%',
														borderColor:
															'rgb(255,187,0)',
														backgroundColor: 'rgba(255,255,255, 0.7)'
													}}
													value={
														lastName
													}
													onChangeText={LastName => saveLastNameChange(LastName)}
												/>
											</View>
										</View>
									</View>
								</View>
								<View
									style={{
										flexDirection: 'row',
										width:
											Dimensions.get('screen').width -
											160,
										alignSelf: 'center',
										alignContent: 'center',
										justifyContent: 'center',
										marginBottom: 10
									}}
								>
									<Button
										title={'Annuleren'}
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
											paddingLeft: 20,
											paddingRight: 20
										}}
									/>
									<Button
										disabled={
											firstName ==
											'' ||
											lastName == ''
										}
										title="Opslaan"
										onPress={saveFunc}
										titleStyle={{
											fontSize:
												Dimensions.get('screen')
													.width < 370
													? 17
													: 19,
											color: 'white',
											fontWeight: 'bold',
											marginTop: -4
										}}
										buttonStyle={{
											backgroundColor: 'green',
											borderRadius: 5,
											height: 40,
											marginLeft: 10,
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
		);
	};
}
export default InsertNameModal;
