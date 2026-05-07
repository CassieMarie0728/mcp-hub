import { Link } from "expo-router";
import { Text, type TextProps } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useColors } from "@/hooks/use-colors";

export function ExternalLink(props: TextProps & { href: string }) {
  return (
    <Link href={props.href as any}>
      <Text {...props} style={[props.style, { color: "#0a7ea4" }]} />
    </Link>
  );
}
