const { updateUserSubscriptionStatus } = require('../userMethods');
const User = require('../User');
const mongoose = require('mongoose');

jest.mock('../User');

describe('updateUserSubscriptionStatus', () => {
  beforeAll(() => {
    mongoose.Types.ObjectId = jest.fn(() => 'someObjectId');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add 100 messages to balance and set lastPaymentDate for active subscriptions', async () => {
    const mockUser = {
      stripeCustomerId: 'cus_test123',
      subscriptionStatus: 'inactive',
      messageBalance: 2,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);

    const result = await updateUserSubscriptionStatus('cus_test123', 'active');

    expect(result.success).toBe(true);
    expect(mockUser.messageBalance).toBe(102);
    expect(mockUser.lastPaymentDate).not.toBeNull();
  });

  it('should retain the current balance for inactive subscriptions', async () => {
    const mockUser = {
      stripeCustomerId: 'cus_test123',
      subscriptionStatus: 'active',
      messageBalance: 50,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);

    const result = await updateUserSubscriptionStatus('cus_test123', 'inactive');

    expect(result.success).toBe(true);
    expect(mockUser.messageBalance).toBe(50); // Retain the balance
  });

  it('should return an error if subscription status is invalid', async () => {
    const result = await updateUserSubscriptionStatus('cus_test123', 'invalid_status');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid subscription status');
  });

  it('should return an error if user is not found', async () => {
    User.findOne.mockResolvedValue(null);

    const result = await updateUserSubscriptionStatus('cus_test123', 'active');

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });
});
