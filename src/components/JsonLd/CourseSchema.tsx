import JsonLd from "./JsonLd";
import { COURSES, ORG, PERSON } from "../../lib/constants";

export default function CourseSchema() {
  const data = {
    "@context": "https://schema.org",
    "@graph": COURSES.map((c) => ({
      "@type": "Course",
      name: c.name,
      description: c.description,
      url: c.url,
      provider: {
        "@type": "Organization",
        "@id": `${ORG.url}#organization`,
        name: ORG.name,
        sameAs: ORG.url,
      },
      instructor: {
        "@type": "Person",
        "@id": `${PERSON.url}#person`,
        name: PERSON.name,
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Online",
        courseWorkload: "PT8H",
      },
    })),
  };
  return <JsonLd data={data} />;
}
