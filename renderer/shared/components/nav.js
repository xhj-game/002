import React from 'react'
import PropTypes from 'prop-types'
import {withRouter} from 'next/router'
import {FiInstagram, FiSettings, FiUserCheck, FiUsers} from 'react-icons/fi'
import {margin, rem, borderRadius} from 'polished'
import {Box, List, Link, Text} from '.'
import Flex from './flex'
import theme from '../theme'
import Loading from './loading'
import useValidation from '../utils/useValidation'
import {useIdentityState, IdentityStatus} from '../providers/identity-context'
import {useEpochState, EpochPeriod} from '../providers/epoch-context'

function Nav() {
  const identity = useIdentityState()
  const {nickname} = identity

  const epoch = useEpochState()

  if (!epoch) {
    return null
  }

  const {currentPeriod, nextValidation} = epoch
  return (
    <nav>
      <Box css={margin(rem(theme.spacings.medium32), 0, rem(40), 0)}>
        <img src="../static/logo.svg" alt="idena logo" />
      </Box>
      <List>
        <NavItem href="/dashboard" active icon={<FiUserCheck />}>
          {'My Idena' || nickname}
        </NavItem>
        <NavItem href="/flips" icon={<FiInstagram />}>
          Flips
        </NavItem>
        <NavItem href="/contacts" icon={<FiUsers />}>
          Contacts
        </NavItem>
        {/* <NavItem href="/chats" icon={<FiMessageSquare />}>
          Chats
        </NavItem> */}
        <NavItem href="/settings" icon={<FiSettings />}>
          Settings
        </NavItem>
        <Box
          bg={theme.colors.white01}
          my={theme.spacings.xlarge}
          css={{
            ...borderRadius('top', rem(10)),
            ...borderRadius('bottom', rem(10)),
          }}
        >
          <Block title="Current period">{currentPeriod}</Block>
          <Block title="My current task">
            <CurrentTask period={currentPeriod} identity={identity} />
          </Block>
          {currentPeriod === EpochPeriod.None && (
            <Block title="Next validation">
              {new Date(nextValidation).toLocaleString()}
            </Block>
          )}
        </Box>
        <Box
          bg={theme.colors.white01}
          my={theme.spacings.xxlarge}
          css={{
            ...borderRadius('top', rem(10)),
            ...borderRadius('bottom', rem(10)),
          }}
        >
          <Block title="Version">{global.appVersion}</Block>
        </Box>
      </List>
      <style jsx>{`
        nav {
          background: ${theme.colors.primary2};
          color: ${theme.colors.white};
          text-align: center;
          min-height: 100vh;
          z-index: 2;
        }
        nav :global(ul) {
          padding: 0 ${rem(16)};
          width: 200px;
        }
        img {
          width: 80px;
          filter: invert(1);
        }
      `}</style>
    </nav>
  )
}

const NavItem = withRouter(({href, router, icon, children}) => {
  const active = router.pathname.startsWith(href)
  const color = active ? theme.colors.white : theme.colors.white05
  return (
    <li>
      <Link href={href} color={color} width="100%" height="100%">
        <Flex align="center">
          {React.cloneElement(icon, {color, fontSize: theme.fontSizes.normal})}
          <Box w="8px" />
          {children}
        </Flex>
      </Link>
      <style jsx>{`
        li {
          ${active && `background: ${theme.colors.white01}`};
          border-radius: 4px;
          color: ${theme.colors.white05};
          cursor: pointer;
          padding: 0 1em;
          line-height: 2.2em;
          margin: 0 0 0.5em;
          transition: background 0.3s ease;
        }
        li:hover {
          border-radius: 4px;
          background: ${theme.colors.white01};
        }
      `}</style>
    </li>
  )
})

function Block({title, children, fallback = <Loading />}) {
  return (
    <Box
      bg="none"
      p={theme.spacings.normal}
      css={{
        borderBottom: `solid 1px ${theme.colors.gray3}`,
      }}
    >
      <Text
        color={theme.colors.muted}
        css={{display: 'block', marginBottom: theme.spacings.small}}
      >
        {title}
      </Text>
      <Text
        color={theme.colors.white}
        css={{
          display: 'block',
        }}
      >
        {children || fallback}
      </Text>
    </Box>
  )
}

Block.propTypes = {
  title: PropTypes.string,
  fallback: PropTypes.node,
  children: PropTypes.node,
}

function CurrentTask({period, identity}) {
  const {
    running: validationRunning,
    shortAnswers,
    longAnswers,
  } = useValidation()

  if (!period || !identity || !identity.state) {
    return null
  }

  const {requiredFlips, flips, state, canActivateInvite} = identity

  if (canActivateInvite && period === EpochPeriod.None) {
    return (
      <Link href="/dashboard" color={theme.colors.white}>
        Activate invite
      </Link>
    )
  }

  if ([IdentityStatus.Verified, IdentityStatus.Newbie].includes(state)) {
    if (period === EpochPeriod.None) {
      const numOfFlipsToSubmit = requiredFlips - (flips || []).length
      const shouldSendFlips = numOfFlipsToSubmit > 0
      return shouldSendFlips ? (
        <Link href="/flips" color={theme.colors.white}>
          Create {numOfFlipsToSubmit} flip{numOfFlipsToSubmit > 1 ? 's' : ''}
        </Link>
      ) : (
        'Wait for validation'
      )
    }
    if (validationRunning) {
      if (shortAnswers.length && longAnswers.length) {
        return 'Wait for validation end'
      }
      const href = `/validation/${
        period === EpochPeriod.ShortSession ? 'short' : 'long'
      }`
      return (
        <Link href={href} color={theme.colors.white}>
          Solve flips now!
        </Link>
      )
    }
  }

  if (
    [
      IdentityStatus.Candidate,
      IdentityStatus.Suspend,
      IdentityStatus.Zombie,
    ].includes(state)
  ) {
    if (period === EpochPeriod.None) {
      return 'Wait for validation'
    }
    if (validationRunning) {
      if (shortAnswers.length && longAnswers.length) {
        return 'Wait for validation end'
      }
      const href = `/validation/${
        period === EpochPeriod.ShortSession ? 'short' : 'long'
      }`
      return (
        <Link href={href} color={theme.colors.white}>
          Solve flips now!
        </Link>
      )
    }
  }

  if (period === EpochPeriod.FlipLottery) {
    return 'Flips lottery'
  }

  if (period === EpochPeriod.AfterLongSession) {
    return 'Wait for validation end'
  }

  return '...'
}

CurrentTask.propTypes = {
  period: PropTypes.oneOf(Object.values(EpochPeriod)),
  identity: PropTypes.shape({
    requiredFlips: PropTypes.number,
    flips: PropTypes.array,
    state: PropTypes.string,
    canActivateInvite: PropTypes.bool,
  }).isRequired,
}

export default Nav