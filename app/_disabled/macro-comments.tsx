import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Macro Comments Screen
 * Displays threaded comments on macro lines
 */
export default function MacroCommentsScreen() {
  const router = useRouter();
  const colors = useColors();

  const [newComment, setNewComment] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Mock comments data
  const comments = [
    {
      id: 'c1',
      lineNumber: 5,
      author: 'John Doe',
      content: 'This line could be optimized by using batch operations',
      createdAt: '2 hours ago',
      resolved: false,
      reactions: [
        { emoji: '👍', count: 3 },
        { emoji: '💡', count: 1 },
      ],
      replies: [
        {
          id: 'c1r1',
          author: 'Jane Smith',
          content: 'Great suggestion! I can implement that in the next version',
          createdAt: '1 hour ago',
          reactions: [{ emoji: '👍', count: 2 }],
        },
      ],
    },
    {
      id: 'c2',
      lineNumber: 12,
      author: 'Mike Johnson',
      content: 'Should we add error handling here?',
      createdAt: '1 hour ago',
      resolved: true,
      reactions: [{ emoji: '❓', count: 2 }],
      replies: [
        {
          id: 'c2r1',
          author: 'Sarah Williams',
          content: 'Yes, I added try-catch in the latest commit',
          createdAt: '30 minutes ago',
          reactions: [{ emoji: '✅', count: 1 }],
        },
      ],
    },
    {
      id: 'c3',
      lineNumber: 18,
      author: 'Alex Brown',
      content: '@John This approach is similar to the pattern we used in macro-123',
      createdAt: '30 minutes ago',
      resolved: false,
      reactions: [{ emoji: '🔗', count: 1 }],
      replies: [],
    },
  ];

  /**
   * Toggle thread expansion
   */
  const toggleThread = (commentId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedThreads(newExpanded);
  };

  /**
   * Render comment
   */
  const renderComment = (comment: any, isReply: boolean = false) => (
    <View key={comment.id} className={cn('gap-2', isReply && 'ml-4 border-l border-border pl-3')}>
      {/* Comment Header */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-foreground">{comment.author}</Text>
          <Text className="text-xs text-muted">{comment.createdAt}</Text>
        </View>

        {comment.resolved && (
          <View className="bg-success/20 rounded-full px-2 py-1">
            <Text className="text-xs font-bold text-success">✓ Resolved</Text>
          </View>
        )}
      </View>

      {/* Comment Content */}
      <Text className="text-sm text-foreground">{comment.content}</Text>

      {/* Reactions */}
      {comment.reactions && comment.reactions.length > 0 && (
        <View className="flex-row gap-2 flex-wrap">
          {comment.reactions.map((reaction: any, idx: number) => (
            <Pressable
              key={idx}
              className="bg-surface rounded-full px-2 py-1 border border-border active:opacity-80"
            >
              <Text className="text-xs">
                {reaction.emoji} {reaction.count}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Reply Button */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <Pressable
          onPress={() => toggleThread(comment.id)}
          className="flex-row items-center gap-1 active:opacity-80"
        >
          <Text className="text-xs font-semibold text-primary">
            {expandedThreads.has(comment.id) ? '▼' : '▶'} {comment.replies.length} replies
          </Text>
        </Pressable>
      )}

      {/* Replies */}
      {expandedThreads.has(comment.id) &&
        comment.replies &&
        comment.replies.map((reply: any) => (
          <View key={reply.id} className="mt-2">
            {renderComment(reply, true)}
          </View>
        ))}
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Comments</Text>
            <Text className="text-base text-muted">Collaborate with your team</Text>
          </View>

          {/* Statistics */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted">Total Comments</Text>
              <Text className="text-2xl font-bold text-foreground">12</Text>
            </View>

            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted">Unresolved</Text>
              <Text className="text-2xl font-bold text-foreground">2</Text>
            </View>

            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted">Resolved</Text>
              <Text className="text-2xl font-bold text-foreground">10</Text>
            </View>
          </View>

          {/* Comments List */}
          <View className="gap-4">
            <Text className="text-sm font-semibold text-muted">RECENT DISCUSSIONS</Text>

            {comments.map((comment) => (
              <View
                key={comment.id}
                className="bg-surface rounded-xl p-4 border border-border gap-3"
              >
                {/* Line Reference */}
                <View className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                  <Text className="text-xs font-mono text-primary">Line {comment.lineNumber}</Text>
                </View>

                {/* Comment Content */}
                {renderComment(comment)}
              </View>
            ))}
          </View>

          {/* New Comment Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">ADD COMMENT</Text>

            <View className="bg-surface rounded-xl border border-border overflow-hidden gap-2 p-3">
              <TextInput
                placeholder="Share your thoughts... (use @username to mention)"
                placeholderTextColor={colors.muted}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={3}
                className="text-foreground"
                style={{ color: colors.foreground }}
              />

              <View className="flex-row gap-2">
                <Pressable className="flex-1 bg-surface border border-border rounded-lg p-2 active:opacity-80">
                  <Text className="text-center font-semibold text-foreground text-sm">Cancel</Text>
                </Pressable>

                <Pressable className="flex-1 bg-primary rounded-lg p-2 active:opacity-80">
                  <Text className="text-center font-semibold text-background text-sm">Post Comment</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
