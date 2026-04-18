import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Pong() {
  const navigate = useNavigate();
  useEffect(() => { navigate(createPageUrl('Home')); }, []);
  return null;
}