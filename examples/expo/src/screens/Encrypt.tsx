import { Button } from "@/src/ui/Button";
import { Chip } from "@/src/ui/Chip";
import { Code } from "@/src/ui/Code";
import { Heading } from "@/src/ui/Heading";
import { useEvervault } from "@evervault/react-native";
import { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NUMBER_VALUE = 123;
const BOOLEAN_VALUE = true;
const STRING_VALUE = "Hello world";
const OBJECT_VALUE = { hello: "world" };
const ARRAY_VALUE = ["Hello", "world"];
const NULL_VALUE = null;

const VALUES = [
  { label: "String", value: STRING_VALUE },
  { label: "Number", value: NUMBER_VALUE },
  { label: "Boolean", value: BOOLEAN_VALUE },
  { label: "Object", value: OBJECT_VALUE },
  { label: "Array", value: ARRAY_VALUE },
  { label: "Null", value: NULL_VALUE },
];

function format(value: any) {
  if (value === undefined) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

export function EncryptExample() {
  const evervault = useEvervault();
  const insets = useSafeAreaInsets();

  const editorRef = useRef<TextInput>(null);
  const [value, setValue] = useState(format(STRING_VALUE));
  const [encrypted, setEncrypted] = useState<any>();

  const [error, setError] = useState<Error | null>(null);

  const handleEncrypt = useCallback(async () => {
    Keyboard.dismiss();
    try {
      const json = JSON.parse(value);
      const encrypted = await evervault.encrypt(json);
      setEncrypted(encrypted);
    } catch (error) {
      setError(error as Error);
    }
  }, [value, evervault.encrypt]);

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top }]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="interactive"
    >
      <View style={styles.header}>
        <Heading>Encrypt</Heading>
      </View>

      {error && <Text style={styles.error}>{error.message}</Text>}

      <ScrollView
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
      >
        {VALUES.map((value) => (
          <Chip key={value.label} onPress={() => setValue(format(value.value))}>
            {value.label}
          </Chip>
        ))}
      </ScrollView>

      <View style={styles.body}>
        <TextInput
          ref={editorRef}
          style={styles.editor}
          value={value}
          onChangeText={setValue}
          multiline
          textAlignVertical="top"
          placeholder="Enter JSON to encrypt"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
        />

        <Button onPress={handleEncrypt}>Encrypt</Button>

        <Code style={styles.code}>{format(encrypted)}</Code>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    paddingBlock: 16,
    gap: 16,
    flex: 1,
  },
  header: {
    paddingInline: 16,
  },
  error: {
    color: "red",
    paddingInline: 16,
  },
  body: {
    flex: 1,
    gap: 16,
    paddingInline: 16,
  },

  chipsScroll: {
    flexGrow: 0,
    marginBottom: -6,
  },
  chips: {
    paddingInline: 16,
    flexDirection: "row",
    gap: 4,
  },
  editor: {
    flex: 1,
    padding: 14,
    backgroundColor: "#FBFAFD",
    borderWidth: 1,
    borderColor: "#E9E5F5",
    borderRadius: 12,
    fontFamily: Platform.select({
      ios: "Menlo",
      default: "monospace",
    }),
    fontSize: 12,
    lineHeight: 20,
    width: "100%",
    color: "#000",
  },

  code: {
    flex: 1,
  },
});
