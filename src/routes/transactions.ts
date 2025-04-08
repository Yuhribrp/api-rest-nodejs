import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

// Cookies: Way to keep context between requests

export async function transactionsRoute(app: FastifyInstance) {
  // GET /transactions
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select('*')

      return { transactions }
    },
  )

  // GET /transactions/:id
  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { sessionId } = request.cookies
      const { id } = getTransactionParamsSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      if (!transaction) {
        return reply.status(404).send({
          message: 'Transaction not found',
        })
      }
      return { transaction }
    },
  )

  // GET /transactions/summary
  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )

  // POST /transactions
  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = crypto.randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        secure: true,
        sameSite: true,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1, // Debit is negative
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
