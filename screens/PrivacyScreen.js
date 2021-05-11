import React, { useEffect } from 'react';
import {
    View,
    Text,
    BackHandler,
    ScrollView
} from 'react-native';

export default function PrivacyScreen({ navigation }) {

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', handleBackPress);

        return function cleanUp() {
            BackHandler.removeEventListener(
                'hardwareBackPress',
                handleBackPress
            );
        }
    })

    return (
        <ScrollView
            style={{
                elevation: 5,
                marginTop: 5
            }}
        >
            <View
                style={{
                    paddingLeft: 5,
                    paddingRight: 5,
                    paddingBottom: 5
                }}
            >
                <View
                    style={{
                        borderWidth: 1,
                        borderTopWidth: 0,
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingBottom: 10,
                        borderColor: 'transparent'
                    }}
                >
                    <View
                        style={{
                            justifyContent: 'center',
                            alignContent: 'center',
                            flex: 1
                        }}
                    >
                        <Text style={{ marginTop: 10, fontSize: 16 }}>
                            Algemene Voorwaarden (incl. cookiegebruik){'\n'}
                            {'\n'}
                            {'\n'}
                                1.
                                {'\n'}
                                Representin.nl is met de grootst mogelijke zorg
                                samengesteld en aanvaardt dan ook geen enkele
                                aansprakelijkheid voor het eventueel niet goed
                                functioneren van haar website en mobiele app (in
                                welke voor vorm dan ook) ten aanzien van
                                eventuele (technische) onjuistheden of
                                onvolledigheden van de getoonde gegevens,
                                informatie, afbeeldingen, video's, alsmede
                                linken en verwijzingen naar andere websites.
                                {'\n'}
                            {'\n'}
                                2.{'\n'}
                                Representin.nl doet er alles aan om deze website
                                zo goed mogelijk te beveiligen in zoverre dit
                                technisch mogelijk is en in zoverre dit in haar
                                macht staat. Echter, wij zijn niet aansprakelijk
                                voor schade, welke geleden is door
                                gebruikers/leden of derden, voortvloeiende door
                                het gebruik van haar website, welke het gevolg
                                zijn/is van onvoldoende beveiliging in z’n
                                algemeenheid.
                                {'\n'}
                            {'\n'}
                                3.{'\n'}
                                Representin.nl is niet aansprakelijk voor het
                                onjuist handelen of nalaten van haar
                                gebruikers/leden, welke (persoonlijke)
                                informatie danwel beeldmateriaal op deze website
                                tonen en/of beschikbaar stellen, welke al dan
                                niet mede bestemd is voor derden.
                                {'\n'}
                            {'\n'}
                                4.{'\n'}
                                Representin.nl behoudt zich ten alle tijden het
                                recht voor om - zonder opgave van redenen -
                                personen of persoonsprofielen te weigeren, aan
                                te passen en/of te verwijderen, welke is/zijn
                                opgegeven bij een éérste registratie en/of
                                latere aanpassing (tekst/profielfoto) na
                                goedkeuring van aanmelding c.q. Log-in.
                                {'\n'}
                            {'\n'}
                                5.{'\n'}
                                Namen en email-adressen, welke (bij registratie)
                                uit willekeurig en onsamenhangend gekozen
                                karakters (letters/cijfers) bestaan en/of
                                inhoudelijk de fatsoensnorm overschrijden,
                                worden bij constatering verwijderd.
                                {'\n'}
                            {'\n'}
                                6.{'\n'}
                                Het plaatsen van spam (reclame), links en/of
                                verwijzingen naar website's van en door
                                gebruikers/leden (welke gebruik maken van
                                Representin.nl), alsmede samenhangend met
                                inhoudelijke contents zoals: erotische
                                afbeeldingen, video's, teksten e.d. zijn evemin
                                niet toegestaan en zullen dan ook bij
                                constatering hiervan worden aangepast c.q.
                                verwijderd.
                                {'\n'}
                            {'\n'}
                                7.{'\n'}
                                Representin.nl respecteert altijd de privacy van
                                alle gebruikers/leden en zal nooit persoonlijke
                                gegevens en e-mailadressen verstrekken aan
                                derden t.b.v. reclame en/of andere commerciële
                                doeleinden.
                                {'\n'}
                            {'\n'}
                                8.{'\n'}
                                Representin.nl behoudt zich het recht voor om
                                informatie, mededelingen en berichten, welke
                                geplaatst zijn door gebruikers/leden op deze
                                website aan te passen danwel te verwijderen,
                                indien "deze" in strijd zijn met de policy van
                                Representin.nl alsmede de Nederlandse wetgeving.
                                {'\n'}
                            {'\n'}
                                9.{'\n'}
                                Representin.nl is niet verantwoordelijk voor
                                inhoudelijke-contents op de aan deze website
                                gekoppelde bestanden, welke door
                                gebruikers/leden van derden zijn verkregen en/of
                                websites waar naar wordt door)verwezen.
                                {'\n'}
                            {'\n'}
                                10.{'\n'}
                                Aanlevering van eigen gemaakt(e) werk(en) zoals:
                                foto’s (reportages), videobeelden/bestanden
                                en/of geluidsfragmenten, middels digitale
                                datadragers of via upload middels email en/of
                                ftp-internet, door gebruikers/leden alsmede op
                                vrijwillige en freelance basis werkende
                                fotografen en in opdracht van representin.nl,
                                waarop géén copyright van derden berust, worden
                                op basis van persoonlijkheidsrechten van de
                                auteur, deels overgedragen naar representin.nl,
                                hetgeen inhoud dat representin.nl bevoegd is tot
                                plaatsing van de door de auteur gemaakte en
                                aangeleverde werken zoals eerder genoemd op haar
                                platform alsmede sociaal media en dat de
                                auteur/rechthebbende eigenaar hiermee afstand
                                doet van evt. geldelijke claimen bij
                                representin.nl. Ook zal de auteur/rechthebbende
                                eigenaar zijn of haar werken, welke in opdracht
                                zijn gemaakt zijn/worden van representin.nl
                                alleen verspreiden (in welke vorm dan ook) met
                                het logo/watermerk/kenmerk van representin.nl
                                tenzij anders schriftelijk/mondeling en
                                wederzijds (buiten deze Algemene Voorwaarden)is
                                overeengekomen.
                                {'\n'}
                            {'\n'}
                                11.{'\n'}
                                Representin.nl is zich voortdurend aan het
                                verbeteren/optimaliseren, je gaat er dan ook mee
                                akkoord dat het aanbod, de layout alsmede de
                                inhoudelijke aard van de website representin.nl
                                en representin/zakelijk van tijd tot tijd kan
                                veranderen zonder enige kennisgeving vooraf.
                                {'\n'}
                            {'\n'}
                                12.{'\n'}
                                Wanneer je je aanmeld op representin.nl, stem je
                                ermee in dat we je informatief (middels email)
                                op de hoogte mogen houden d.m.v.,
                                nieuws(brieven), updates, aktie's e.d., mede ten
                                behoeve van representin.nl en
                                representin/zakelijk.
                                {'\n'}
                            {'\n'}
                                13.{'\n'}
                                Reclame- uitingen/doeleinden van "derden", welke
                                mede vermeld worden op onze visitekaartjes,
                                flyers, folders, nieuws(brieven) en andere
                                vormen van informatieve datadragers, worden
                                eventueel mede verstuurd/verzonden, ten behoeve
                                van het algemeen aanbod alsmede het up-to-date
                                houden van representin.nl
                                {'\n'}
                            {'\n'}
                                14.{'\n'}
                                Bij gebruikmaking van betaalde sms-actie's
                                (indien actief) op reperesentin.nl dienen de
                                gebruiker/leden er zelf voor zorg te dragen dat
                                alle gegevens correct worden ingevuld en/of
                                doorgegeven. Representin.nl kan niet
                                aansprakelijk worden gesteld als "foutieve sms-
                                datagegevens" worden ontvangen/verzonden door
                                representin.nl
                                {'\n'}
                            {'\n'}
                                15.{'\n'}
                                Bij win & ticketactie's krijgen eventuele
                                winnaars automatisch bericht middels het door
                                ons bekende en/of opgegeven emailadres danwel
                                social media zoals facebook e.d. Geen
                                (persoonlijk) bericht is niet gewonnen. Over de
                                uitslag van een al dan niet gewonnen win-acties
                                kan niet worden gecorrespondeerd.
                                {'\n'}
                            {'\n'}
                                16.{'\n'}
                                COOKIEGEBRUIK!{'\n'}
                            {'\n'}
                                Representin.nl maakt gebruik van cookies m.b.t.
                                statistieken en heeft vanuit de
                                Telecommunicatiewet de verplichting, om dit aan
                                haar bezoekers mede te delen. Derde partijen
                                kunnen ook cookies plaatsen die nodig zijn om
                                bijv. video’s te kunnen tonen op onze website of
                                te zorgen dat je informatie vanuit
                                Representin.nl kunt delen op social media zoals;
                                Facebook, Twitter en Youtube. Vanuit deze policy
                                dient bij registratie dan ook toestemming te
                                worden gevraagd voor het specifieke gebruik van
                                cookies.
                                {'\n'}
                            {'\n'}
                                Aansprakelijkheid t.a.v. Derde Partijen:{'\n'}
                                Representin.nl is niet aansprakelijk voor schade
                                (in welke vorm dan ook) of verkregen
                                privacy-gegevens van bezoekers/leden, door
                                geplaatste bestanden en/of cookies van Derde
                                Partijen.{'\n'}
                            {'\n'}
                                Info:
                                {'\n'}
                            {'\n'}
                                Indien je met o.a. Google surft over het
                                internet, dan behoudt "deze" zich het recht voor
                                informatie aan derden te verschaffen indien zij
                                hiertoe wettelijk worden verplicht. Hierop kan
                                representin.nl geen enkele invloed op
                                uitoefenen.
                                {'\n'}
                            {'\n'}
                                17.
                                {'\n'}
                                Een verzoek tot verwijdering van je
                                account/gegevens op Representin.nl is alleen
                                mogelijk door contact op te nemen met ons via de
                                email.
                                {'\n'}
                            {'\n'}
                                18.{'\n'}
                                Representin.nl heeft wettelijke de verplichting
                                om geregistreerde gebruikers/leden op de hoogte
                                te stellen van elke aanpassingen of wijziging
                                van deze "Algemene Gebruiksvoorwaarden". Echter,
                                om technische redenen waaronder te verstaan:
                                spamfilters (intern/extern), onjuiste
                                gebruikergegevens, ongeldige opgegeven en/of
                                verlopen email-adressen ect. kan representin.nl
                                niet garanderen dat gebruikers/leden deze
                                berichtgeving van evt. aanpassingen of
                                wijzigingen ook daadwerkelijk zullen worden
                                ontvangen.{'\n'}
                            {'\n'}
                                Het is dan ook van belang dat gebruikers en/of
                                leden zelf van tijd tot tijd deze "Algemene
                                Gebruiksvoorwaarden " doorlezen op eventuele
                                aanpassingen of wijziging.
                                {'\n'}
                            {'\n'}
                                19.{'\n'}
                                Met iedere aanpassing/wijziging van de
                                bovenstaande "Algemene Gebruiksvoorwaarden "
                                komen de laatst geldende "Algemene
                                Gebruiksvoorwaarden" te vervallen.
                                {'\n'}
                            {'\n'}
                                20.{'\n'}
                                Op deze "Algemene Gebruiksvoorwaarden" is het -
                                Algemeen Nederlands Recht - van toepassing.
                                {'\n'}
                            {'\n'}
                                21.{'\n'}
                                Door gebruik te maken, of je te registreren
                                danwel in te loggen op de website(s) van
                                representin.nl en/of alle andere overige
                                diensten welke verbonden zijn met
                                representin.nl, ga je akkoord met deze
                                bovenstaande "Algemene Gebruiksvoorwaarden"
                                incl. "Cookiegebruik"."
                            </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    function handleBackPress() {
        navigation.goBack();
        return true;
    };
}
