import type { NextApiRequest, NextApiResponse } from 'next'
import { scan } from '@/lib/score'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { content } = req.body
  const result = scan(content)
  
  res.status(200).json(result)
}
