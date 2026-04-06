import type { Command } from '../../commands.js'
import { hasAnthropicApiKeyAuth } from '../../utils/auth.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

export default () =>
  ({
    type: 'local-jsx',
    name: 'login',
    description: hasAnthropicApiKeyAuth()
      ? 'Switch CodePilot accounts'
      : 'Sign in with your CodePilot account',
    isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),
    load: () => import('./login.js'),
  }) satisfies Command
