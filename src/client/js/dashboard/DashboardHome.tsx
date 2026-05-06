/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  getUserInfo, useAccount, useAccounts, useStatements, useOperationsWithRequestsAndBank,
} from '@admin/admin.store';
import { endpoints } from '@api';
import {
  IExpandedStatement, IOperation, IRequest, OperationType, RequestStatus,
} from '@interfaces';
import AccountSelectorComponent from '@components/AccountSelector';
import { DashboardTabs } from './Dashboard';

const INLINE_LIST_THRESHOLD = 3; // 1..N inline; > N uses combobox
const FEED_LIMIT = 6;

const balanceFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactBalanceFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFmt = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'always',
});

const signedDollarsFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'always',
});

const splitBalance = (n: number) => {
  const [whole, cents] = balanceFmt.format(Math.abs(n)).split('.');
  return { whole: (n < 0 ? '-' : '') + whole, cents };
};

const findLatestStatement = (statements: IExpandedStatement[]) => {
  if (!statements.length) return null;
  return statements.reduce((latest, curr) => {
    const latestDt = DateTime.fromObject({ month: latest.month, year: latest.year });
    const currDt = DateTime.fromObject({ month: curr.month, year: curr.year });
    return currDt > latestDt ? curr : latest;
  });
};

const periodLabel = (s: IExpandedStatement | null) => {
  if (!s) return '';
  return DateTime.fromObject({ month: s.month, year: s.year }).toFormat('LLLL yyyy');
};

interface Props {
  accountNumber: string;
}

const DashboardHome: React.FC<Props> = ({ accountNumber }) => {
  const navigate = useNavigate();
  const { userinfo } = getUserInfo();
  const { account, accountLoading } = useAccount(accountNumber);
  const { accounts } = useAccounts();
  const { statements, statementsLoading } = useStatements(accountNumber);
  const { operations, requests, dataLoading: opsLoading } = useOperationsWithRequestsAndBank(accountNumber);

  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!accountLoading && !statementsLoading) {
      const t = window.setTimeout(() => setRevealed(true), 16);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [accountLoading, statementsLoading]);

  const loading = accountLoading || statementsLoading;
  const latest = !loading ? findLatestStatement(statements) : null;
  const balance = latest ? latest.endBalance : (account?.openingBalance ?? 0);
  const deltaDollars = latest ? latest.netReturn : 0;
  const deltaPercent = latest && latest.openingBalance
    ? latest.netReturn / latest.openingBalance
    : 0;

  const deltaState = !latest
    ? 'none'
    : deltaDollars > 0 ? 'positive' : deltaDollars < 0 ? 'negative' : 'neutral';

  const ownerName = (userinfo?.name ?? userinfo?.username ?? '').split(' ')[0] || userinfo?.displayName || '';

  const otherAccounts = (accounts || []).filter((a) => a?.accountNumber && a.accountNumber !== accountNumber);

  const goStatements = () => navigate(`${endpoints.dashboard}/${accountNumber}/${DashboardTabs.statements}`);
  const goTransfers = () => navigate(`${endpoints.dashboard}/${accountNumber}/${DashboardTabs.transfers}`);
  const goAccount = (n: string) => navigate(`${endpoints.dashboard}/${n}/home`);

  // Unified activity feed: statements + operations + open requests, date-desc, capped at FEED_LIMIT.
  type FeedEvent = {
    key: string;
    when: DateTime;
    dateLabel: string;
    name: string;
    meta: string;
    metaState: 'positive' | 'negative' | 'caution' | 'neutral';
    onSelect: () => void;
  };
  const formatDate = (dt: DateTime) => (
    dt.year === DateTime.now().year ? dt.toFormat('LLL d') : dt.toFormat('LLL yyyy')
  );
  const feed: FeedEvent[] = [];

  // Statements — period close events.
  (statements || []).forEach((s: IExpandedStatement) => {
    const when = DateTime.fromObject({ month: s.month, year: s.year }).endOf('month');
    const sign = (s.netReturn || 0);
    feed.push({
      key: `stmt-${s.id}`,
      when,
      dateLabel: formatDate(when),
      name: `${DateTime.fromObject({ month: s.month, year: s.year }).toFormat('LLLL yyyy')} statement closed`,
      meta: signedDollarsFmt.format(sign),
      metaState: sign > 0 ? 'positive' : sign < 0 ? 'negative' : 'neutral',
      onSelect: goStatements,
    });
  });

  // Operations — credits and distributions actually posted.
  (operations || []).forEach((op: IOperation) => {
    if (op.deleted || op.amount == null) return;
    const opDate = (op.day && op.month && op.year)
      ? DateTime.fromObject({ day: op.day, month: op.month, year: op.year })
      : (op.created ? DateTime.fromMillis(op.created) : DateTime.now());
    const isCredit = op.type === OperationType.Credit;
    const signed = (isCredit ? 1 : -1) * Math.abs(op.amount);
    feed.push({
      key: `op-${op.id}`,
      when: opDate,
      dateLabel: formatDate(opDate),
      name: isCredit ? 'Credit posted' : 'Distribution posted',
      meta: signedDollarsFmt.format(signed),
      metaState: isCredit ? 'positive' : 'negative',
      onSelect: goStatements,
    });
  });

  // Requests — only surface those still open (no posted operation yet).
  (requests || []).forEach((r: IRequest) => {
    if (r.status !== RequestStatus.Pending && r.status !== RequestStatus.Approved) return;
    if ((r.operations || []).length > 0) return; // already represented by an Operation row
    const when = r.datetime ? DateTime.fromMillis(r.datetime) : DateTime.fromMillis(r.created || 0);
    const isCredit = r.type === OperationType.Credit;
    const signed = (isCredit ? 1 : -1) * Math.abs(r.amount || 0);
    const verb = isCredit ? 'Credit requested' : 'Distribution requested';
    const statusLabel = r.status === RequestStatus.Approved ? 'approved' : 'pending review';
    feed.push({
      key: `req-${r.id}`,
      when,
      dateLabel: formatDate(when),
      name: `${verb} · ${statusLabel}`,
      meta: signedDollarsFmt.format(signed),
      metaState: 'caution',
      onSelect: goTransfers,
    });
  });

  feed.sort((a, b) => b.when.toMillis() - a.when.toMillis());
  const rows = feed.slice(0, FEED_LIMIT);
  const hasMore = feed.length > FEED_LIMIT;

  const updatedLabel = latest
    ? DateTime.fromObject({ month: latest.month, year: latest.year }).endOf('month').toFormat('LLL d, yyyy')
    : '';
  const isStale = latest
    ? DateTime.fromObject({ month: latest.month, year: latest.year }).endOf('month') < DateTime.now().minus({ months: 2 })
    : false;

  const balanceParts = splitBalance(balance);
  const useComboboxSelector = otherAccounts.length > INLINE_LIST_THRESHOLD;
  const showInlineList = otherAccounts.length > 0 && !useComboboxSelector;

  return (
    <div className={`dashboard-home${revealed ? ' dashboard-home--revealing' : ''}`}>
      <div className="dashboard-home__inner">
        {/* Zone 1 — Masthead */}
        <header className="dashboard-home__masthead">
          {loading ? (
            <>
              <div className="dashboard-home__skeleton dashboard-home__skeleton--name" />
              <div className="dashboard-home__skeleton dashboard-home__skeleton--meta" />
            </>
          ) : (
            <>
              <p className="dashboard-home__name">
                {ownerName}
              </p>
              <p className={`dashboard-home__metaline${isStale ? ' dashboard-home__metaline-stale' : ''}`}>
                <span className="dashboard-home__account-number">{accountNumber}</span>
                {updatedLabel && (
                  <>
                    {' · '}{periodLabel(latest)}{' · Last updated '}{updatedLabel}
                  </>
                )}
              </p>
            </>
          )}
        </header>
        {!loading && useComboboxSelector && (
          <div className="dashboard-home__switcher" aria-label="Switch account">
            <span className="dashboard-home__switcher-label">Switch account</span>
            <div className="dashboard-home__switcher-control">
              <AccountSelectorComponent
                currentAccount={account}
                tab={DashboardTabs.home}
              />
            </div>
          </div>
        )}

        {/* Zone 2 — Specimen */}
        <section className="dashboard-home__specimen" aria-label="Account balance and period change">
          <p className="dashboard-home__specimen-label">Account balance</p>
          {loading ? (
            <>
              <div className="dashboard-home__skeleton dashboard-home__skeleton--balance" />
              <div className="dashboard-home__skeleton dashboard-home__skeleton--delta" />
            </>
          ) : (
            <>
              <button
                type="button"
                className="dashboard-home__balance"
                onClick={goStatements}
                aria-label={`Account balance ${balanceFmt.format(balance)}, view statements`}
              >
                {balanceParts.whole}<span className="dashboard-home__balance-cents">.{balanceParts.cents}</span>
              </button>
              {latest ? (
                <button
                  type="button"
                  className={`dashboard-home__delta dashboard-home__delta--${deltaState}`}
                  onClick={goStatements}
                >
                  <span className="dashboard-home__delta-figure">
                    {percentFmt.format(deltaPercent)}
                    {'  ·  '}
                    {signedDollarsFmt.format(deltaDollars)}
                  </span>
                  <span className="dashboard-home__delta-period">
                    Since {periodLabel(latest)}
                  </span>
                </button>
              ) : (
                <p className="dashboard-home__delta-empty">Awaiting first statement period.</p>
              )}
            </>
          )}
        </section>

        {/* Zone 3 — Activity feed (statements + operations + open requests, date-desc) */}
        <section className="dashboard-home__activity" aria-label="Recent activity">
          <p className="dashboard-home__activity-label">Activity</p>
          {loading || opsLoading ? (
            <ul className="dashboard-home__activity-list" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="dashboard-home__activity-row" style={{ cursor: 'default' }}>
                  <div className="dashboard-home__skeleton dashboard-home__skeleton--row" />
                </li>
              ))}
            </ul>
          ) : rows.length ? (
            <>
              <ul className="dashboard-home__activity-list">
                {rows.map((row) => (
                  <li key={row.key}>
                    <a
                      href="#"
                      className="dashboard-home__activity-row"
                      onClick={(e) => { e.preventDefault(); row.onSelect(); }}
                    >
                      <span className="dashboard-home__activity-date">{row.dateLabel}</span>
                      <span className="dashboard-home__activity-name">{row.name}</span>
                      <span className={`dashboard-home__activity-meta dashboard-home__activity-meta--${row.metaState}`}>
                        {row.meta}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              {hasMore && (
                <a
                  href="#"
                  className="dashboard-home__activity-more"
                  onClick={(e) => { e.preventDefault(); goStatements(); }}
                >
                  View full statement history →
                </a>
              )}
            </>
          ) : (
            <p className="dashboard-home__activity-empty">No activity yet.</p>
          )}
        </section>

        {/* Zone 4 — Other accounts (1..INLINE_LIST_THRESHOLD only; combobox above handles larger sets) */}
        {showInlineList && (
          <section className="dashboard-home__selector" aria-label="Other accounts">
            <p className="dashboard-home__selector-label">Other accounts</p>
            <ul className="dashboard-home__selector-list">
              {otherAccounts.map((a) => (
                <li key={a.accountNumber}>
                  <a
                    href="#"
                    className="dashboard-home__selector-row"
                    onClick={(e) => { e.preventDefault(); goAccount(a.accountNumber); }}
                  >
                    <span className="dashboard-home__selector-name">
                      {a.name || a.displayName || a.businessEntity || a.accountNumber}
                    </span>
                    <span className="dashboard-home__selector-balance">
                      {a.openingBalance != null ? compactBalanceFmt.format(a.openingBalance) : '·'}
                    </span>
                    <span className="dashboard-home__selector-delta dashboard-home__selector-delta--neutral">
                      {a.accountNumber}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

DashboardHome.displayName = 'DashboardHome';

export default DashboardHome;
