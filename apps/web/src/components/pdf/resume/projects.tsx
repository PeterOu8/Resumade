import { StyleSheet, Text, View, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    color: '#7c46e1',
    fontWeight: 700,
  },
  date: {
    marginTop: 4,
  },
  link: {
    textDecoration: 'none',
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tech: {
    flexDirection: 'row',
  },
});
type ProjectProps = {
  title: string;
  url?: string;
  dates?: string;
  bullets: string[];
  techStack: string[];
};

export default function Project({
  title,
  url,
  dates,
  bullets,
  techStack,
}: ProjectProps) {
  return (
    <View wrap={false} style={{ marginBottom: 4 }}>
      <Link src={url} style={styles.link}>
        <Text style={styles.title}>{title}</Text>
      </Link>
      <Text style={styles.date}>{dates}</Text>
      {bullets.length > 0 && (
        <View style={styles.list}>
          {bullets.map((description) => (
            <View key={description} style={styles.listItem}>
              <Text style={{ marginLeft: 4 }}>{description}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.tech}>Tech Stack: {techStack.join(', ')}</Text>
    </View>
  );
}
