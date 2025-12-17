    shadowColor: colors.ACTION_BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  listContainer: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ACTION_BLUE,
    gap: spacing.sm,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ACTION_BLUE,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.ERROR_RED,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.ACTION_BLUE,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProjectDetailsList;
