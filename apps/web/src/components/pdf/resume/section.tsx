import { StyleSheet, Text, View } from '@react-pdf/renderer';

type SectionProps = React.PropsWithChildren & {
  title: string;
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },
  title: {
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#000000',
  },
  separator: {
    height: 2,
    marginTop: 1,
    marginBottom: 2,
    backgroundColor: '#000000',
  },
});

export default function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.separator} />
      {children}
    </View>
  );
}
