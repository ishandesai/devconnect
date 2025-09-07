"use client";
import {useQuery } from "@apollo/client/react";
import {gql} from "@apollo/client"

const HELLO = gql`
  query {
    hello
  }
`;

export default function Home() {
  const { data, loading, error } = useQuery(HELLO);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <main className="p-8">
      GraphQL says: <b>{data.hello}</b>
    </main>
  );
}