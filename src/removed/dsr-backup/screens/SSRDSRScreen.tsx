// SSR/DSR screen removed
// This screen acted as the main UI for the SSR/DSR submodule. The module has
// been removed from this repository and will be implemented elsewhere. Keep a
// minimal placeholder file so imports remain valid while the new module is
// developed in its new location.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SSRDSRScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SSR/DSR module removed</Text>
      <Text style={styles.message}>This module has been relocated. Implement it in the new location.</Text>
    </View>
  );
};

export default SSRDSRScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { color: '#666', textAlign: 'center' },
});

                    {p.nameOfWorkShort} - {p.nameOfWork}
                  </option>
                ))}
              </select>
            ) : (
              <Text style={styles.mobileNote}>Use web version for project selector</Text>
            )}
          </View>
          <View style={styles.topBarRight}>
            <View style={styles.filterGroup}>
              <TouchableOpacity
                style={[styles.filterBtn, sourceFilter === 'both' ? styles.filterBtnActive : null]}
                onPress={() => setSourceFilter('both')}
              >
                <Text style={[styles.filterText, sourceFilter === 'both' ? styles.filterTextActive : null]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, sourceFilter === 'tenders' ? styles.filterBtnActive : null]}
                onPress={() => setSourceFilter('tenders')}
              >
                <Text style={[styles.filterText, sourceFilter === 'tenders' ? styles.filterTextActive : null]}>Tenders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, sourceFilter === 'dsr' ? styles.filterBtnActive : null]}
                onPress={() => setSourceFilter('dsr')}
              >
                <Text style={[styles.filterText, sourceFilter === 'dsr' ? styles.filterTextActive : null]}>DSR</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.newButton} onPress={handleAddProject}>
              <Text style={styles.newButtonText}>+ New Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Projects Cards Grid/List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E90FF" />
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        ) : (
          <FlatList
            data={(() => {
              if (sourceFilter === 'tenders') return tenderProjects;
              if (sourceFilter === 'dsr') return dsrProjects;
              // both: merge and sort by createdAt desc
              const merged = [...dsrProjects, ...tenderProjects];
              const uniqueMap = new Map<string, DSRProject>();
              merged.forEach((p) => {
                // prefer dsrProjects entry if id collides
                if (!uniqueMap.has(p.id) || !(p as any).createdFromTender) {
                  uniqueMap.set(p.id, p);
                }
              });
              return Array.from(uniqueMap.values()).sort((a, b) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return bTime - aTime;
              });
            })()}
            keyExtractor={(item) => item.id}
            renderItem={renderProjectCard}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            numColumns={isMobile ? 1 : isTablet ? 2 : 3}
            key={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Add/Edit Project Form Modal */}
      <AddEditProjectForm
        visible={showAddForm}
        project={selectedProject}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  moduleInfoBanner: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#1E90FF',
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16
  },
  moduleInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8
  },
  moduleInfoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    gap: 6,
    marginRight: 8,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterBtnActive: {
    backgroundColor: '#1E90FF',
  },
  filterText: {
    fontSize: 13,
    color: '#374151'
  },
  filterTextActive: {
    color: '#fff'
  },
  featureList: {
    marginTop: 8
  },
  featureItem: {
    fontSize: 13,
    color: '#1E40AF',
    marginVertical: 4,
    lineHeight: 18
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  topBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  mobileNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic'
  },
  newButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center'
  },
  emptyButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});
