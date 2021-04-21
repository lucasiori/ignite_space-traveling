/* eslint-disable react/no-danger */
import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const readingTime = useMemo((): string => {
    if (!post?.data?.content) return '';

    const postWords = post.data.content.reduce((acc, current) => {
      return [
        ...acc,
        ...current.heading.split(' '),
        ...RichText.asText(current.body).split(' '),
      ];
    }, []);

    const wordsPerMinute = 200;
    const resultReadingTime = Math.ceil(postWords.length / wordsPerMinute);

    return `${resultReadingTime} min`;
  }, [post]);

  const publicationDate = useMemo((): string => {
    if (!post?.first_publication_date) return '';

    const formattedDate = format(
      parseISO(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    );

    return formattedDate;
  }, [post]);
  return (
    <>
      <Header />

      {isFallback && (
        <div className={`${commonStyles.container} ${styles.loading}`}>
          <div className={styles.loading} />

          <p>Carregando...</p>
        </div>
      )}

      {!isFallback && (
        <>
          <section className={styles.hero}>
            <img src={post.data.banner.url} alt="Banner" />
          </section>

          <article className={`${commonStyles.container} ${styles.post}`}>
            <header>
              <h1 className={commonStyles.title}>{post.data.title}</h1>

              <div className={commonStyles.postDetails}>
                <span className={commonStyles.detail}>
                  <img src="/calendar.svg" alt="Data de publicação" />
                  {publicationDate}
                </span>

                <span className={commonStyles.detail}>
                  <img src="/user.svg" alt="Autor do post" />
                  {post.data.author}
                </span>

                <span className={commonStyles.detail}>
                  <img src="/clock.svg" alt="Tempo de leitura" />
                  {readingTime}
                </span>
              </div>
            </header>

            {post.data.content.map(content => (
              <div key={content.heading}>
                {content.heading && <h2>{content.heading}</h2>}

                {content.body && (
                  <div
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                )}
              </div>
            ))}
          </article>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const staticpaths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: staticpaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
    first_publication_date: response.first_publication_date,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24 * 7, // 7 days
  };
};
