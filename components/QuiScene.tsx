import { Album } from "@/components/Album";
import { InfoNote } from "@/components/InfoNote";
import { Block } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";
import { DropsMark } from "@/components/TitleMarks";

const BIO =
  "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K. Je suis né en 2007 en France. Je suis né différent, avec le syndrome du THPI. Depuis toujours, je me suis intéressé à ce que personne ne voulait ou ne pouvait regarder. Depuis toujours, je vis, je vois, je mange, je fais, je parle, je pense et je rêve différemment — je fais tout différemment. Ce site, il sert à quoi ? À publier ce que je fais, à montrer à des gens qui veulent comprendre ce que je fais en tant que polymath au quotidien.";

export function QuiScene() {
  return (
    <>
      <ScrollTitle id="titre-qui" text="Qui suis-je" icon={<DropsMark />} max={5.4} />
      <section className="qui-follow scroll-reveal">
        <Album />
        <div className="qui-note">
          <p>
            <Block lines={["100%", "98%", "96%", "94%", "90%", "84%", "62%"]}>{BIO}</Block>
          </p>
        </div>
        <InfoNote />
      </section>
    </>
  );
}
