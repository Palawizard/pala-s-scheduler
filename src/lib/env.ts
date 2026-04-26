import { z } from 'zod'

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

const requiredString = z.preprocess(emptyToUndefined, z.string().min(1))
const optionalString = z.preprocess(emptyToUndefined, z.string().optional())

const envSchema = z
  .object({
    DATABASE_URL: requiredString,
    EMAIL_FROM: requiredString,
    EMAIL_SERVER: optionalString,
    GOOGLE_CLIENT_ID: requiredString,
    GOOGLE_CLIENT_SECRET: requiredString,
    META_APP_ID: requiredString,
    META_APP_SECRET: requiredString,
    NEXTAUTH_SECRET: requiredString,
    NEXTAUTH_URL: requiredString,
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    R2_ACCESS_KEY_ID: requiredString,
    R2_ACCOUNT_ID: requiredString,
    R2_BUCKET_NAME: requiredString,
    R2_PUBLIC_URL: requiredString,
    R2_SECRET_ACCESS_KEY: requiredString,
    REDIS_URL: requiredString,
    TIKTOK_CLIENT_KEY: requiredString,
    TIKTOK_CLIENT_SECRET: requiredString,
    TWITTER_CLIENT_ID: requiredString,
    TWITTER_CLIENT_SECRET: requiredString,
  })
  .superRefine((env, context) => {
    const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'
    if (env.NODE_ENV === 'production' && !isProductionBuild && !env.EMAIL_SERVER) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required in production',
        path: ['EMAIL_SERVER'],
      })
    }
  })

function validateEnv() {
  if (process.env.SKIP_ENV_VALIDATION === '1') {
    return process.env as z.infer<typeof envSchema>
  }

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Variables d'environnement invalides :\n${missing}`)
  }

  return parsed.data
}

export const env = validateEnv()
