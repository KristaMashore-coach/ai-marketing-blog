import JsonLd from "./JsonLd";
import { PERSON, ORG } from "../../lib/constants";

export default function PersonSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${PERSON.url}#person`,
    name: PERSON.name,
    jobTitle: PERSON.jobTitle,
    description: PERSON.description,
    url: PERSON.url,
    image: PERSON.image,
    sameAs: PERSON.sameAs,
    knowsAbout: PERSON.knowsAbout,
    worksFor: { "@type": "Organization", "@id": `${ORG.url}#organization` },
  };
  return <JsonLd data={data} />;
}
