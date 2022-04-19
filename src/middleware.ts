import devMiddleware from 'webpack-dev-middleware'
import hotMiddleware from 'webpack-hot-middleware'
import type { Compiler } from 'webpack'
import type { Context, Next } from 'koa'
import type { Options as devMiddlewareOptions } from 'webpack-dev-middleware'
import type { MiddlewareOptions as hotMiddlewareOptions } from 'webpack-hot-middleware'

export const koaWebpackHotMiddleware = (compiler: Compiler, options: hotMiddlewareOptions = {}) => {
  const middleware = hotMiddleware(compiler, options)
  const koaMiddleware = async (ctx: Context, next: Next) => {
    const { req, res } = ctx
    const { end: originalEnd } = res
    const runNext = await new Promise((resolve) => {
      res.end = function end() {
        originalEnd.apply(this, arguments as any)
        resolve(0)
        return this
      }
      middleware(req, res, () => {
        resolve(1)
      })
    })
    if (runNext) await next()
  }
  return koaMiddleware
}

export const koaWebpackDevMiddleware = (compiler: Compiler, options: devMiddlewareOptions<any, any> = {}) => {
  const expressMiddleware = devMiddleware(compiler, options)

  const koaMiddleware = async (ctx: Context, next: Next) => {
    const { req } = ctx
    const locals = ctx.locals || ctx.state

    ctx.webpack = expressMiddleware
    const runNext = await new Promise((resolve) => {
      expressMiddleware(
        req,
        {
          locals,
          send(body: unknown) {
            ctx.body = body
            resolve(0)
          },
          set(field: string, value: string | string[]) {
            ctx.response.set(field, value)
          },
          get(field: string) {
            return ctx.response.get(field)
          }
        } as any,
        () => {
          resolve(1)
        }
      )
    })

    if (runNext) await next()
  }

  Object.keys(expressMiddleware).forEach(
    (key) => {
      Object.assign(koaMiddleware, {[key]: expressMiddleware[key as keyof typeof expressMiddleware]})
    }
  )

  return koaMiddleware
}
