import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const HomeScreen = ({ navigation }) => {
  const [todos, setTodos] = useState([]);
  const [nightMode, setNightMode] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const storedTodos = await AsyncStorage.getItem("todos");
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      } else {
        try {
          const response = await fetch("https://dummyjson.com/todos");
          const data = await response.json();
          const fetchedTodos = data.todos || [];
          setTodos(fetchedTodos);
          await AsyncStorage.setItem("todos", JSON.stringify(fetchedTodos));
        } catch (error) {
          console.error("Error fetching todos:", error);
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const markComplete = async (id) => {
    const updatedTodos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    setTodos(updatedTodos);
    await AsyncStorage.setItem("todos", JSON.stringify(updatedTodos));

    // Update the server
    fetch(`https://dummyjson.com/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: !todos.find((todo) => todo.id === id).completed,
      }),
    })
      .then((res) => res.json())
      .then((updatedTodo) => {
        const updatedTodos = todos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, completed: updatedTodo.completed };
          }
          return todo;
        });
        setTodos(updatedTodos);
        AsyncStorage.setItem("todos", JSON.stringify(updatedTodos));
      });
  };

  const delTodo = async (id) => {
    fetch(`https://dummyjson.com/todos/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(async () => {
        const updatedTodos = todos.filter((todo) => todo.id !== id);
        setTodos(updatedTodos);
        await AsyncStorage.setItem("todos", JSON.stringify(updatedTodos));
      });
  };

  const addTodo = async () => {
    const newTodoItem = {
      id: todos.length + 1,
      todo: newTodo,
      completed: false,
    };
    const updatedTodos = [...todos, newTodoItem];
    setTodos(updatedTodos);
    setNewTodo("");
    await AsyncStorage.setItem("todos", JSON.stringify(updatedTodos));
  };

  const handleModeSwitch = () => {
    setNightMode(!nightMode);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, nightMode ? styles.nightMode : {}]}>
      <Text style={styles.header}>Todo List</Text>

      <View style={styles.switchContainer}>
        <Text>Night Mode</Text>
        <Switch value={nightMode} onValueChange={handleModeSwitch} />
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <Text
              style={[
                styles.todoText,
                {
                  textDecorationLine: item.completed ? "line-through" : "none",
                },
              ]}
            >
              {item.todo}
            </Text>
            <TouchableOpacity onPress={() => markComplete(item.id)}>
              <Text style={styles.buttonText}>
                {item.completed ? "Undo" : "Complete"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => delTodo(item.id)}>
              <Text style={[styles.buttonText, { color: "red" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TextInput
        placeholder="Add new todo"
        value={newTodo}
        onChangeText={setNewTodo}
        style={styles.input}
      />
      <View style={styles.buttonContainer}>
        <Button style={styles.addTodo} title="Add Todo" onPress={addTodo} />
        <Button
          style={styles.addTodo}
          title="Go to details"
          onPress={() => navigation.navigate("Details")}
        />
      </View>
    </SafeAreaView>
  );
};

// Your second screen
function DetailsScreen() {
  return (
    <View style={styles.centered}>
      <Text>This is the Details screen</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20, // Adjust this value to change the spacing
  },
  addTodo: {
    marginBottom: "20px",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  nightMode: {
    backgroundColor: "#333",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  todoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  todoText: {
    fontSize: 18,
  },
  buttonText: {
    color: "blue",
    marginLeft: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
  },
});
