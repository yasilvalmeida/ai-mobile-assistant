import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, FAB, Chip, Text, Card, Avatar, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AppDispatch, RootState } from '../../store';
import { fetchReports, setFilters } from '../../store/slices/reportsSlice';
import { FieldReport, ReportStatus, ReportCategory } from '../../../../shared/src/types';
import { theme } from '../../theme/theme';

const STATUS_COLORS: Record<ReportStatus, string> = {
  [ReportStatus.DRAFT]: theme.colors.outline,
  [ReportStatus.IN_PROGRESS]: theme.colors.warning,
  [ReportStatus.COMPLETED]: theme.colors.success,
  [ReportStatus.REVIEWED]: theme.colors.primary,
  [ReportStatus.ARCHIVED]: theme.colors.onSurfaceVariant,
};

export const ReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { reports, isLoading, filters } = useSelector((state: RootState) => state.reports);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    dispatch(setFilters({ ...filters, query }));
  };

  const handleCategoryFilter = (category: ReportCategory | null) => {
    setSelectedCategory(category);
    dispatch(setFilters({ ...filters, category: category || undefined }));
  };

  const handleRefresh = () => {
    dispatch(fetchReports());
  };

  const renderReportItem = ({ item }: { item: FieldReport }) => (
    <Card
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail' as never, { reportId: item.id } as never)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Avatar.Icon
            size={40}
            icon="file-document"
            style={{ backgroundColor: theme.colors.primaryContainer }}
          />
          <View style={styles.cardHeaderText}>
            <Text variant="titleMedium" numberOfLines={1}>{item.title}</Text>
            <Text variant="bodySmall" style={styles.categoryText}>
              {item.category} • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: STATUS_COLORS[item.status] }]}
            textStyle={styles.statusChipText}
          >
            {item.status.replace('_', ' ')}
          </Chip>
        </View>
        {item.description && (
          <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <View style={styles.attachmentInfo}>
            {item.attachments.length > 0 && (
              <>
                <IconButton icon="paperclip" size={16} />
                <Text variant="bodySmall">{item.attachments.length}</Text>
              </>
            )}
            {item.ocrResults.length > 0 && (
              <>
                <IconButton icon="text-recognition" size={16} />
                <Text variant="bodySmall">{item.ocrResults.length}</Text>
              </>
            )}
          </View>
          {item.aiSummary && (
            <Chip icon="robot" compact style={styles.aiChip}>AI Summary</Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const categories = Object.values(ReportCategory);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search reports..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={[null, ...categories]}
          keyExtractor={(item) => item || 'all'}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item}
              onPress={() => handleCategoryFilter(item)}
              style={styles.filterChip}
            >
              {item || 'All'}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No reports found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Create your first report to get started
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReport' as never)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchbar: {
    margin: theme.spacing.md,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  filterChip: {
    marginRight: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  reportCard: {
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    padding: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  categoryText: {
    color: theme.colors.onSurfaceVariant,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    color: 'white',
    fontSize: 10,
  },
  description: {
    marginTop: theme.spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiChip: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
  },
  emptySubtext: {
    color: theme.colors.outline,
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default ReportsScreen;
