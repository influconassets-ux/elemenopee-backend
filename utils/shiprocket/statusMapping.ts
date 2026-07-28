/**
 * Maps Shiprocket's numeric or string status codes to our internal normalized status.
 */
export const mapShiprocketStatusToInternal = (statusCode: number | string): string => {
  const code = Number(statusCode);
  
  // Based on Shiprocket Documentation
  switch (code) {
    case 1: // AWB Assigned
    case 2: // Label Generated
    case 3: // Pickup Scheduled
    case 4: // Pickup Queued
    case 5: // Manifest Generated
      return "PROCESSING";
    
    case 6: // Shipped
    case 17: // Out for Delivery
    case 19: // Out for Pickup
      return "SHIPPED";
      
    case 7: // Delivered
      return "DELIVERED";
      
    case 8: // Cancelled
      return "CANCELLED";
      
    case 9: // RTO Initiated
    case 10: // RTO Delivered
      return "RTO_INITIATED";
      
    case 11: // Pending
    case 12: // Lost
    case 13: // Pickup Error
    case 14: // RTO Acknowledged
    case 15: // Pickup Rescheduled
    case 16: // Cancellation Requested
    case 18: // In Transit
      return "IN_TRANSIT";
      
    default:
      return "PROCESSING";
  }
};
