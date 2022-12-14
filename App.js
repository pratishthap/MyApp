/**
 * A simple SignalR chat client written in React Native
 * https://github.com/jonathanzufi/SignalR-react-native-client
**/

import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { setJSExceptionHandler } from 'react-native-exception-handler';

const errorHandler = (e, isFatal) => {
  console.log('Global error handler');
}
setJSExceptionHandler(errorHandler, true);

// Defines how we'll render incoming messages in the message log
function MessageItem({ title }) {
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function buttonEnabled(enabled) {
  return (enabled ? styles.buttonText_enabled : styles.buttonText_disabled);
}

// The public hub to connect to. This is running code from https://github.com/jonathanzufi/SignalRWebServer 
const hub_endpoint = 'http://70.133.218.214:13953/chathub';

const App = () => {

  const [user, onChangeUserText] = React.useState('');
  const [message, onChangeMessageText] = React.useState('');
  const [conn, setConn] = React.useState(null);
  const [messageLog, setMessageLog] = React.useState([]);
  const [connectionState, setConnectedStateText] = React.useState('');
  const [isConnected, setConnected] = React.useState(false);

  // Initialize the hub endpoint and set up routes for incoming events
  useEffect(() => {

    // Setting the log level to Debug will generate tons more diagnostic
    // messages in the console log which can help give a deeper understanding
    // of how SignalR works and what it's doing under the covers
    const connection = new HubConnectionBuilder()
    .withUrl(hub_endpoint)
      .configureLogging(LogLevel.Debug)
      .build();

    setConnectedStateText(`Trying to connect to ${hub_endpoint}`);

    // Try to start the connection
    connection
      .start()
      .then(() => {
        setConnectedStateText(`Connected to ${hub_endpoint}`);
        setConnected(true);
      })
      .catch(err => console.log(`Error starting the connection: ${err.toString()}`));

    // Handle connection closing
    connection.onclose(async () => {
      setConnectedStateText(`Disconnected from ${hub_endpoint}`);
      setConnected(false);
    });

    // Incoming messages will grow the message log array
    connection.on("ReceiveMessage", function (user, message) {
      setMessageLog(messageLog => [...messageLog.concat({
        id: Date.now().toString(),    // Give our flatlist keyExtractor something to key off
        user: user,
        message: message
      })]);
    });

    // This isn't very elegant but I'm still learning about scope and state in React Native
    // This seemed like the logical way to make the connection object available to the 'Reconnect' button
    // but I think the connection object/handler should be encapsulated into it's own component
    setConn(connection);

  }, []);


  return (
    <>
      <SafeAreaView>
        <View>
          <View style={styles.sectionContainer}>

            <Text style={styles.sectionTitle}>SignalR Demo</Text>
            <Text style={styles.connectedto}>{connectionState}</Text>

            <TextInput placeholder='User' style={styles.fields}
              onChangeText={text => onChangeUserText(text)} value={user}
            />

            <TextInput placeholder='Message' style={styles.fields}
              onChangeText={text => onChangeMessageText(text)} value={message}
            />

            <View style={{ flex: 1, flexDirection: 'row' }}>

              <TouchableOpacity style={styles.button} onPress={() => {
                if (user.length === 0 || message.length === 0)
                  return;
                console.log(`Sending ${message} from ${user}`);
                conn.invoke("SendMessage", `${user}`, `${message}`).catch(function (err) {
                  console.log(`Error sending ${message} from ${user}: ${err.message}`);
                });
                onChangeMessageText('');
              }}>
                <Text style={buttonEnabled(isConnected)}>Send</Text>
              </TouchableOpacity>


              <TouchableOpacity style={styles.button} onPress={() => {
                onChangeUserText('');
                onChangeMessageText('');
                setMessageLog([]);
              }}>
                <Text style={buttonEnabled(isConnected)}>Clear</Text>
              </TouchableOpacity>


              <TouchableOpacity style={styles.button} onPress={() => {
                conn
                  .start()
                  .then(() => {
                    console.log(`Connected to the hub endpoint: ${hub_endpoint}`)
                    setConnectedStateText('Connected to ' + hub_endpoint);
                    setConnected(true);
                  })
                  .catch(err => console.log(`Error starting the connection: ${err.toString()}`));

              }}>
                <Text style={buttonEnabled(!isConnected)}>Reconnect</Text>
              </TouchableOpacity>

            </View>

            <FlatList
              style={styles.messageList}
              data={messageLog}
              renderItem={({ item }) => <MessageItem title={'\u2B24 ' + item.user + ' says: ' + item.message} />}
              keyExtractor={item => item.id}
            />

          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32, paddingHorizontal: 24, backgroundColor: 'white'
  },
  connectedto: {
    fontSize: 10, fontStyle: 'italic'
  },
  fields: {
    marginTop: 20, paddingLeft: 10, fontSize: 15, height: 40, borderWidth: 1
  },
  sectionTitle: {
    fontSize: 24, fontWeight: '600', color: 'black',
  },
  button: {
    borderWidth: 2, borderColor: "#89AAFF", width: 109, height: 50, alignItems: 'center',
    justifyContent: 'center', marginTop: 20, marginRight: 20
  },
  buttonText_enabled: {
    fontSize: 20, color: 'black'
  },
  buttonText_disabled: {
    fontSize: 20, color: '#dfe1e6'
  },
  messagelogitem: {
    backgroundColor: '#f9c2ff', padding: 10, marginVertical: 4, marginHorizontal: 4,
  },
  messageList: {
    marginTop: 90
  }
});

export default App;
