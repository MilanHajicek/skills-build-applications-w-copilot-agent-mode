import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  emptyMessage: string;
  isEmpty: (data: T) => boolean;
  renderData: (data: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, endpoint, emptyMessage, isEmpty, renderData }: Props<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    getJson<T>(endpoint).then((result) => {
      if (active) setData(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : String(requestError));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [endpoint]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {loading && <p role="status">Loading {title.toLowerCase()}...</p>}
    {!loading && error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
    {!loading && !error && data !== undefined && (isEmpty(data) ? <p>{emptyMessage}</p> : renderData(data))}
  </div></section>;
}
