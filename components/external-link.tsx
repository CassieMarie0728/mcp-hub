import { Link } from "expo-router";
import { Text, type TextProps } from "react-native";

export function ExternalLink(props: TextProps & { href: string }) {
  return (
    <Link href={props.href}>
      <Text {...props} style={[props.style, { color: "#0a7ea4" }]} />
    </Link>
  );
}
