import JsonLd from "./JsonLd";
import { ORG, PERSON } from "../../lib/constants";

export default function OrganizationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${ORG.url}#organization`,
    name: ORG.name,
    legalName: ORG.legalName,
    url: ORG.url,
    logo: ORG.logo,
    foundingDate: ORG.foundingDate,
    description: ORG.description,
    founder: { "@type": "Person", "@id": `${PERSON.url}#person`, name: PERSON.name },
    sameAs: ORG.sameAs,
    award: ORG.awards,
  };
  return <JsonLd data={data} />;
}
