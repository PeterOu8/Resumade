import { StyleSheet, Text, View, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  school: {
    fontSize: 10,
    color: '#000000',
    fontWeight: 700,
  },
  date: {
    marginTop: 4,
  },
  award: {
    flexDirection: 'row',
  },
});

type EducationProps = {
  school: string;
  degree: string;
  dates: string;
  location: string;
  awards: string[];
};

export default function Education({
  school,
  degree,
  dates,
  location,
  awards,
}: EducationProps) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={styles.school}>
        {school} ({dates})
      </Text>
      <Text>
        {degree} — {location}
      </Text>
      <Text>Award</Text>
      {awards.map((a) => (
        <Text key={a} style={styles.award}>
          ▪ {a}
        </Text>
      ))}
    </View>
  );
}
