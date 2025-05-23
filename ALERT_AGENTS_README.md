# Alert Agents Feature Documentation

## Overview

The Alert Agents feature has been successfully integrated into the Automation Hub (formerly Scheduler page). This feature allows users to create automated alerts that monitor their store's performance metrics and send email notifications when specific thresholds are met.

## Features Implemented

### 1. **Comprehensive Alert Management**
- Create, view, and delete custom alert agents
- Support for multiple metric types (Inventory Level, Orders Count, Revenue, Customer Count)
- Flexible threshold conditions (greater than / less than)
- Configurable check frequencies (hourly, daily, weekly, monthly)
- Custom instructions for alert responses

### 2. **Usage Limits Integration**
- Tier-based limits (Free: 5, Growth: 15, Pro: 50, Enterprise: unlimited)
- Real-time usage tracking with visual progress indicators
- Graceful handling of limit exceeded scenarios

### 3. **Unified Interface**
- Integrated with existing scheduler page as "Automation Hub"
- Section-based navigation between Analysis Schedules and Alert Agents
- Consistent design language with existing application

### 4. **Enhanced User Experience**
- Visual metric color coding
- Status indicators (Active/Inactive)
- Detailed alert history (last checked, last triggered, next check)
- Comprehensive error handling and user feedback

## Technical Implementation

### Backend API Integration

The feature integrates with the following API endpoints:

```typescript
// Fetch alerts with pagination
GET /api/alerts/

// Create new alert
POST /api/alerts/
{
  "name": "Low Inventory Alert",
  "metric": "inventory_level",
  "parameters": {
    "source": "shopify",
    "shopify_user_id": "current_user"
  },
  "instructions": "Check stock levels immediately",
  "threshold_type": "lt",
  "threshold_value": 10,
  "frequency": "daily"
}

// Update alert
PUT/PATCH /api/alerts/{id}/

// Delete alert (soft delete)
DELETE /api/alerts/{id}/

// Get usage status
GET /api/usage-status/
```

### Frontend Components

#### 1. **AlertModal Component**
- Location: `src/app/app/scheduler/AlertModal.tsx`
- Handles alert creation with comprehensive form validation
- Integrates usage limit checking before creation
- Visual metric selection with color-coded options

#### 2. **Updated Scheduler Page**
- Location: `src/app/app/scheduler/page.tsx`
- Now serves as "Automation Hub" with dual functionality
- Section-based navigation between schedules and alerts
- Shared UI patterns and error handling

#### 3. **Enhanced Local Storage Hook**
- Location: `src/hooks/useLocalStorage.ts`
- Extended to support alert data caching
- Includes usage status tracking
- TypeScript interfaces for type safety

### Data Models

```typescript
interface Alert {
  id: number;
  name: string;
  metric: 'inventory_level' | 'orders_count' | 'revenue' | 'customer_count';
  parameters: Record<string, any>;
  instructions?: string;
  threshold_type: 'gt' | 'lt';
  threshold_value: number;
  frequency: string;
  next_run?: string;
  last_evaluated?: string;
  last_triggered?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UsageStatus {
  alerts: {
    used: number;
    limit: number;
    percentage: number;
  };
}
```

## User Interface Features

### 1. **Section Navigation**
- Clean tab interface to switch between Analysis Schedules and Alert Agents
- Badge indicators showing count of items in each section
- Usage limit display for alerts section

### 2. **Alert Creation Flow**
- Step-by-step form with visual metric selection
- Real-time validation and error feedback
- Usage limit checking with clear messaging
- Dynamic form elements based on selected metric

### 3. **Alert Display**
- Color-coded metric indicators
- Status badges (Active/Inactive)
- Threshold display with proper formatting
- Historical data (last checked, triggered, next check)
- Individual delete actions with confirmation

### 4. **Error Handling**
- Comprehensive error messages for API failures
- Form validation with field-specific feedback
- Usage limit exceeded notifications
- Network error recovery

## Configuration Options

### Supported Metrics
1. **Inventory Level** - Monitor stock levels for products
2. **Orders Count** - Track order volume over time
3. **Revenue** - Monitor revenue thresholds
4. **Customer Count** - Track customer acquisition

### Threshold Types
- **Greater Than (gt)** - Alert when value exceeds threshold
- **Less Than (lt)** - Alert when value falls below threshold

### Frequency Options
- Hourly
- Daily
- Weekly
- Monthly
- Custom cron expressions (future enhancement)

## Usage Examples

### 1. **Low Inventory Alert**
```
Name: "Low Stock Alert"
Metric: Inventory Level
Condition: Less than 10 units
Frequency: Daily
Instructions: "Reorder immediately when stock falls below threshold"
```

### 2. **High Revenue Achievement**
```
Name: "Revenue Milestone"
Metric: Revenue
Condition: Greater than $10,000
Frequency: Daily
Instructions: "Celebrate and analyze what drove this success"
```

### 3. **Order Volume Monitoring**
```
Name: "Order Surge Detection"
Metric: Orders Count
Condition: Greater than 50 orders
Frequency: Hourly
Instructions: "Ensure fulfillment team is prepared for high volume"
```

## Benefits for Users

1. **Proactive Monitoring** - Get notified before issues become critical
2. **Automated Insights** - Reduce manual monitoring overhead
3. **Customizable Alerts** - Tailor notifications to specific business needs
4. **Actionable Intelligence** - Receive specific instructions with each alert
5. **Scalable Solution** - Tier-based limits that grow with business needs

## Future Enhancements

1. **Advanced Metrics** - Support for calculated metrics and custom formulas
2. **Multi-Channel Notifications** - SMS, Slack, Discord integrations
3. **Alert Scheduling** - Time-based alert activation/deactivation
4. **Alert Templates** - Pre-configured alerts for common scenarios
5. **Advanced Analytics** - Alert performance and effectiveness tracking

## Testing Recommendations

1. **Functional Testing**
   - Test alert creation with all metric types
   - Verify usage limit enforcement
   - Test alert deletion and bulk operations
   - Validate form submission and error handling

2. **Integration Testing**
   - Test API connectivity and error scenarios
   - Verify local storage persistence
   - Test navigation between sections

3. **User Experience Testing**
   - Test responsive design on mobile devices
   - Verify accessibility features
   - Test loading states and transitions

## Deployment Notes

- All TypeScript interfaces are properly defined
- Build process completes without errors
- Backward compatibility maintained with existing scheduler functionality
- No breaking changes to existing API contracts
- Local storage migration handled gracefully

This implementation provides a robust, user-friendly alert system that integrates seamlessly with the existing thinkr application architecture while maintaining high code quality and user experience standards. 