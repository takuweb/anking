import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { MarkdownView } from './MarkdownView';
import { X, Eye, Edit3, Columns, Bold, Italic, List, Code, Quote, Plus } from 'lucide-react';
import { getTodayDateString } from '../utils/sm2';

interface CardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<Card>) => void;
  initialCard?: Card | null;
  existingTags: string[];
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
  existingTags,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'split' | 'preview'>('edit');
  const [activeField, setActiveField] = useState<'front' | 'back'>('front');

  useEffect(() => {
    if (initialCard) {
      setFront(initialCard.front);
      setBack(initialCard.back);
      setTags(initialCard.tags || []);
    } else {
      setFront('');
      setBack('');
      setTags([]);
    }
    setTagInput('');
    setActiveTab('edit');
  }, [initialCard, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const isFront = activeField === 'front';
    const text = isFront ? front : back;
    const setText = isFront ? setFront : setBack;

    const textarea = document.getElementById(isFront ? 'front-input' : 'back-input') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);

    const replacement = `${before}${selected || 'テキスト'}${after}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected.length || 4));
    }, 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim()) {
      alert('表面（問題・キーワード）を入力してください。');
      return;
    }

    const now = new Date().toISOString();
    const cardData: Partial<Card> = {
      front: front.trim(),
      back: back.trim(),
      tags,
      updatedAt: now,
    };

    if (!initialCard) {
      cardData.id = 'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      cardData.createdAt = now;
      cardData.repetition = 0;
      cardData.interval = 0;
      cardData.easeFactor = 2.5;
      cardData.dueDate = getTodayDateString();
      cardData.lastReviewed = null;
      cardData.history = [];
    }

    onSave(cardData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold">
              {initialCard ? '✏️ カード編集' : '✨ 新規カード作成'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Markdown形式で記述可能</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="エディタのみ"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>編集</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'split'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="エディタとプレビューを並べて表示"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>2分割</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="プレビュー"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>プレビュー</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Markdown Toolbar */}
        {activeTab !== 'preview' && (
          <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-600 dark:text-slate-300 text-xs">
            <span className="text-slate-400 mr-2">挿入:</span>
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              title="太字"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              title="イタリック"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('### ')}
              className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition font-bold"
              title="見出し3"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('- ')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              title="箇条書きリスト"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('`', '`')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              title="インラインコード"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('```\n', '\n```')}
              className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition font-mono"
              title="コードブロック"
            >
              &lt;/&gt;
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('> ')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              title="引用"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Front / Back Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Front (Question) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  表面（問題・キーワード）<span className="text-rose-500">*</span>
                </label>
              </div>

              {activeTab === 'preview' ? (
                <div className="min-h-[140px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  {front ? <MarkdownView content={front} /> : <p className="text-slate-400 italic text-sm">（未入力）</p>}
                </div>
              ) : activeTab === 'split' ? (
                <div className="space-y-2">
                  <textarea
                    id="front-input"
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    onFocus={() => setActiveField('front')}
                    placeholder="例: エビングハウスの忘却曲線とは？"
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition text-sm resize-none font-mono"
                  />
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1">プレビュー:</span>
                    <MarkdownView content={front || '（未入力）'} />
                  </div>
                </div>
              ) : (
                <textarea
                  id="front-input"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  onFocus={() => setActiveField('front')}
                  placeholder="例: エビングハウスの忘却曲線とは？"
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition text-sm resize-y"
                  required
                />
              )}
            </div>

            {/* Back (Answer) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  裏面（解答・解説）
                </label>
              </div>

              {activeTab === 'preview' ? (
                <div className="min-h-[140px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  {back ? <MarkdownView content={back} /> : <p className="text-slate-400 italic text-sm">（未入力）</p>}
                </div>
              ) : activeTab === 'split' ? (
                <div className="space-y-2">
                  <textarea
                    id="back-input"
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    onFocus={() => setActiveField('back')}
                    placeholder="例: 時間の経過に伴う記憶の忘却度合いを示す曲線..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm resize-none font-mono"
                  />
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1">プレビュー:</span>
                    <MarkdownView content={back || '（未入力）'} />
                  </div>
                </div>
              ) : (
                <textarea
                  id="back-input"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  onFocus={() => setActiveField('back')}
                  placeholder="例: 時間の経過に伴う記憶の忘却度合いを示す曲線..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm resize-y"
                />
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              タグ・カテゴリ
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  placeholder="新しいタグを入力してEnter"
                  className="px-3 py-1 text-xs rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                  title="タグ追加"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick tag suggestions from existing tags */}
            {existingTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
                <span className="text-[11px]">候補:</span>
                {existingTags
                  .filter((t) => !tags.includes(t))
                  .slice(0, 8)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"
                    >
                      +{tag}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:scale-95 rounded-xl shadow-md shadow-brand-500/20 transition-all"
            >
              {initialCard ? '変更を保存' : 'カードを作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
