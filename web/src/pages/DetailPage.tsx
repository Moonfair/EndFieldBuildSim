import { useParams } from 'react-router-dom';

export default function DetailPage() {
  const { id } = useParams();
  return <div data-testid="detail-page">Detail Page: {id}</div>;
}
