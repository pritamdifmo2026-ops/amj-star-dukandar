import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LifeBuoy, Plus, MessageSquare, CheckCircle2 } from 'lucide-react';
import Pagination from '@/shared/components/ui/Pagination';
import {
  Card, SectionHeader, Badge, FilterTabs, TableWrap, TH, TD, InlineEmpty, type Tone,
} from './partner.ui';
import { dateTime, refName, humanise } from './partner.format';
import partnerService from '../services/partner.service';

type IssueFilter = '' | 'open' | 'pending' | 'resolved' | 'closed';

const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, Tone> = {
  open: 'danger',
  pending: 'warning',
  resolved: 'success',
  closed: 'neutral',
};

const PRIORITY_TONE: Record<string, Tone> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
};

const PartnerSupport: React.FC<{ onRaiseIssue: () => void }> = ({ onRaiseIssue }) => {
  const [filter, setFilter] = useState<IssueFilter>('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['partner', 'issues', filter, page],
    queryFn: () =>
      partnerService.getSupportIssues({ page, limit: PAGE_SIZE, ...(filter ? { status: filter } : {}) }),
  });

  const issues = data?.issues || [];
  const summary = data?.summary;
  const total = data?.pagination?.total || 0;

  const changeFilter = (next: IssueFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Customer Support"
        subtitle="Support tickets filed by buyers and sellers in your network. AMJ Star handles resolution, and you can raise an issue on their behalf."
        icon={LifeBuoy}
        actions={
          <button
            onClick={onRaiseIssue}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#1e293b] transition-colors shadow-sm"
          >
            <Plus size={14} />
            Raise an Issue
          </button>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <Card className="p-4 border-l-[3px] border-l-[#b91c1c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Open Tickets</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{summary?.open ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#f59e0b]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">In Progress</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{summary?.pending ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#059669]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Resolved</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{summary?.resolved ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Total Tickets</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{summary?.total ?? 0}</p>
        </Card>
      </div>

      <div className="p-4 rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e2e8f0] flex items-center justify-center shrink-0 mt-0.5">
            <LifeBuoy size={16} className="text-[#0f172a]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0f172a] m-0">
              How Support Works for Wholesale Partners
            </p>
            <p className="text-[11px] text-[#475569] m-0 mt-0.5 leading-relaxed">
              <strong>AMJ Star Support resolves all tickets directly.</strong> You have full visibility here to monitor progress and read conversation replies. If one of your referred buyers or sellers is stuck on an order, KYC, or payout, click <strong>Raise an Issue</strong> to report it directly to our support team.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between gap-3 flex-wrap">
          <FilterTabs<IssueFilter>
            value={filter}
            onChange={changeFilter}
            options={[
              { value: '', label: 'All' },
              { value: 'open', label: 'Open', count: summary?.open },
              { value: 'pending', label: 'In progress', count: summary?.pending },
              { value: 'resolved', label: 'Resolved', count: summary?.resolved },
            ]}
          />
          <span className="text-[11px] text-[#64748b] font-semibold">{total} tickets</span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-[#64748b]">Loading issues…</div>
        ) : issues.length === 0 ? (
          <InlineEmpty
            icon={CheckCircle2}
            title={filter ? `No ${filter} tickets` : 'All Clear — No Open Tickets'}
            description="None of your referred buyers or sellers currently have open support tickets. If a customer reports a problem to you, you can raise an issue here directly to AMJ Star Support."
            action={
              <button
                onClick={onRaiseIssue}
                className="px-4 py-2 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#1e293b] shadow-sm"
              >
                Raise an Issue
              </button>
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th className={TH}>Ticket</th>
                  <th className={TH}>Raised by</th>
                  <th className={TH}>Subject</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Priority</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const isOpen = expanded === issue._id;
                  const replies = issue.replies || [];
                  return (
                    <React.Fragment key={issue._id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : issue._id)}
                        className="hover:bg-[#f8fafc] transition-colors cursor-pointer"
                      >
                        <td className={`${TD} font-mono text-[10px] font-bold text-[#0f172a]`}>
                          {issue.ticketId || issue._id.slice(-6).toUpperCase()}
                        </td>
                        <td className={TD}>
                          <p className="m-0 font-semibold text-[#334155]">
                            {refName(issue.userId, issue.buyerName)}
                          </p>
                          {issue.phone && <p className="text-[10px] text-[#94a3b8] m-0">{issue.phone}</p>}
                        </td>
                        <td className={TD}>
                          <p className="m-0 font-bold text-[#0f172a] max-w-[220px] truncate">{issue.subject}</p>
                          {replies.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#1d4ed8] font-bold mt-0.5">
                              <MessageSquare size={9} /> {replies.length}{' '}
                              {replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </td>
                        <td className={TD}>{issue.issueType || '—'}</td>
                        <td className={TD}>
                          <Badge tone={PRIORITY_TONE[issue.priority] || 'neutral'}>{issue.priority}</Badge>
                        </td>
                        <td className={TD}>
                          <Badge tone={STATUS_TONE[issue.status] || 'neutral'}>{humanise(issue.status)}</Badge>
                        </td>
                        <td className={TD}>{dateTime(issue.createdAt)}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#475569] m-0 mb-2">
                              Original message
                            </p>
                            <p className="text-xs text-[#334155] m-0 whitespace-pre-wrap leading-relaxed">
                              {issue.message}
                            </p>

                            {replies.length > 0 && (
                              <>
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#475569] m-0 mt-4 mb-2">
                                  Conversation
                                </p>
                                <div className="flex flex-col gap-2">
                                  {replies.map((reply, idx) => (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-[8px] border text-xs leading-relaxed ${
                                        reply.sender === 'admin'
                                          ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]'
                                          : 'bg-white border-[#e2e8f0] text-[#334155]'
                                      }`}
                                    >
                                      <p className="text-[10px] font-extrabold uppercase tracking-wider m-0 mb-1 opacity-70">
                                        {reply.sender === 'admin' ? 'AMJ Star support' : 'Customer'} ·{' '}
                                        {dateTime(reply.createdAt)}
                                      </p>
                                      <p className="m-0 whitespace-pre-wrap">{reply.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </TableWrap>
            <div className="p-4">
              <Pagination
                totalItems={total}
                itemsPerPage={PAGE_SIZE}
                currentPage={page}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PartnerSupport;
