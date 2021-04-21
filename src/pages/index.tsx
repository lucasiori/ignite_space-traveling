import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleFetchNextPostPage = async (): Promise<void> => {
    const response = await fetch(postsPagination.next_page);
    const data = await response.json();

    const formattedResults = data.results.map(post => {
      return {
        uid: post.uid,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
        first_publication_date: post.first_publication_date,
      };
    });

    setPosts([...posts, ...formattedResults]);
    setNextPage(data.next_page);
  };

  return (
    <div className={`${commonStyles.container} ${styles.homepage}`}>
      <header>
        <img src="/logo.png" alt="logo" />
      </header>

      <main>
        <ul>
          {posts.map(post => (
            <li key={post.uid} className={styles.postItem}>
              <Link href={`/post/${post.uid}`}>
                <a>{post.data.title}</a>
              </Link>

              <p>{post.data.subtitle}</p>

              <div className={commonStyles.postDetails}>
                <span className={commonStyles.detail}>
                  <img src="/calendar.svg" alt="Data de publicação" />
                  {format(
                    parseISO(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </span>

                <span className={commonStyles.detail}>
                  <img src="/user.svg" alt="Autor do post" />
                  {post.data.author}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {nextPage && (
          <button type="button" onClick={handleFetchNextPostPage}>
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 5,
    }
  );

  const formattedResults = response.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        results: formattedResults,
        next_page: response.next_page,
      },
    },
  };
};
