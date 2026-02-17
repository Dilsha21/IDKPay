'use client';

import { Header } from '@/components/header';
import { useAuth } from '@/app/auth-provider';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { ThingToBuy, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Check, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { addThingToBuy, partiallyBuyThing, markThingAsBought, deleteThingToBuy, updateThingToBuy } from '@/app/actions';

export default function ThingsToBuyPage() {
  const { user } = useAuth();
  const [isAddThingOpen, setAddThingOpen] = useState(false);

  // Query for things in the user's group
  const thingsQuery = user?.groupId
    ? query(
      collection(db, 'things-to-buy'),
      where('groupId', '==', user.groupId),
      orderBy('timestamp', 'desc')
    )
    : null;

  const { docs: things, loading } = useFirestoreQuery<ThingToBuy>(thingsQuery);

  // Separate things into needed and bought
  const thingsToBuy = things?.filter(thing => thing.status !== 'bought') || [];
  const alreadyBought = things?.filter(thing => thing.status === 'bought') || [];

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view things to buy</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold flex items-center">
            <ShoppingCart className="mr-2 h-8 w-8" />
            Things to Buy
          </h1>
          <Dialog open={isAddThingOpen} onOpenChange={setAddThingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Thing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Thing to Buy</DialogTitle>
              </DialogHeader>
              <AddThingForm
                onSuccess={() => setAddThingOpen(false)}
                userId={user?.uid || ''}
                groupId={user?.groupId || ''}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Things to Buy</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : thingsToBuy && thingsToBuy.length > 0 ? (
              <div className="space-y-4">
                {thingsToBuy.map((thing) => (
                  <ThingCard
                    key={thing.id}
                    thing={thing}
                    currentUserId={user.uid}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No things to buy found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add your first thing to buy to get started!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Already Bought</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : alreadyBought && alreadyBought.length > 0 ? (
              <div className="space-y-4">
                {alreadyBought.map((thing) => (
                  <div key={thing.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{thing.name}</h3>
                        {thing.description && (
                          <p className="text-sm text-muted-foreground mt-1">{thing.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="mr-1 h-4 w-4" />
                            Bought
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Added {thing.timestamp ? format(thing.timestamp.toDate(), 'MMM dd, yyyy') : 'just now'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">Bought</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bought items yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Items will appear here once they're marked as bought.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ThingCard({ thing, currentUserId }: { thing: ThingToBuy; currentUserId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [action, setAction] = useState<'bought' | 'partially-bought' | 'delete' | 'edit' | null>(null);
  const [partiallyBoughtAmount, setPartiallyBoughtAmount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: thing.name,
    amountNeeded: thing.amountNeeded,
    description: thing.description || '',
    sharedWith: thing.sharedWith
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partially-bought': return 'bg-blue-100 text-blue-800';
      case 'bought': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = () => {
    setAction('edit');
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!isConfirming) {
      setAction('delete');
      setIsConfirming(true);
      return;
    }

    await deleteThingToBuy(thing.id);
    setIsConfirming(false);
    setAction(null);
  };

  const handleSaveEdit = async () => {
    await updateThingToBuy(thing.id, editForm);
    setIsEditing(false);
    setAction(null);
  };

  const handleMarkAsBought = async () => {
    if (!isConfirming) {
      setAction('bought');
      setIsConfirming(true);
      return;
    }

    await markThingAsBought(thing.id, currentUserId);

    setIsConfirming(false);
    setAction(null);
  };

  const handlePartiallyBought = async () => {
    if (!isConfirming) {
      setAction('partially-bought');
      setIsConfirming(true);
      return;
    }

    const paid = Number(partiallyBoughtAmount);
    if (isNaN(paid) || paid <= 0) return;

    await partiallyBuyThing(
      thing.id,
      paid,
      thing.amountNeeded,
      currentUserId
    );

    setIsConfirming(false);
    setAction(null);
    setPartiallyBoughtAmount(0);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{thing.name}</h3>
          {thing.description && (
            <p className="text-sm text-muted-foreground mt-1">{thing.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {thing.status === 'bought' ? (
              <Badge className="bg-green-100 text-green-800">
                <Check className="mr-1 h-4 w-4" />
                Bought
              </Badge>
            ) : (
              <Badge className={getStatusColor(thing.status)}>
                {thing.status}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {thing.addedByName && <span className="font-medium">{thing.addedByName}</span>} added {thing.timestamp ? format(thing.timestamp.toDate(), 'MMM dd, yyyy') : 'just now'}
            </span>
            {thing.addedBy === currentUserId && (
              <div className="flex gap-1 ml-auto">
                <Button
                  onClick={handleEdit}
                  variant="ghost"
                  size="sm"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          {thing.status === 'bought' ? (
            <p className="text-2xl font-bold text-green-600">Bought</p>
          ) : (
            <p className="text-2xl font-bold">
              Amount needed: <span className="font-semibold">{thing.amountNeeded}</span>
            </p>
          )}
          {thing.status === 'partially-bought' && (
            <p className="text-sm text-muted-foreground">
              Partially bought
            </p>
          )}
        </div>
      </div>

      {thing.status === 'pending' || thing.status === 'partially-bought' ? (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handlePartiallyBought}
            variant="outline"
            size="sm"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Partially Bought
          </Button>
          <Button
            onClick={handleMarkAsBought}
            size="sm"
          >
            <Check className="mr-2 h-4 w-4" />
            Mark as Bought
          </Button>
        </div>
      ) : null}

      {isConfirming && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
          <p className="text-sm text-yellow-800">
            {action === 'delete'
              ? 'Are you sure you want to delete this item?'
              : `Are you sure you want to mark this as ${action}?`
            }
          </p>
          {action === 'partially-bought' && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-2">Amount Bought</label>
              <input
                type="number"
                step="1"
                min="0"
                value={partiallyBoughtAmount || ''}
                onChange={(e) => setPartiallyBoughtAmount(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter amount"
                required
              />
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => {
                setIsConfirming(false);
                setAction(null);
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (action === 'delete') {
                  handleDelete();
                } else if (action === 'partially-bought') {
                  const paid = Number(partiallyBoughtAmount);
                  if (isNaN(paid) || paid <= 0) return;
                  partiallyBuyThing(thing.id, paid, thing.amountNeeded, currentUserId);
                } else if (action === 'bought') {
                  markThingAsBought(thing.id, currentUserId);
                }
                setIsConfirming(false);
                setAction(null);
                setPartiallyBoughtAmount(0);
              }}
              size="sm"
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <h4 className="text-sm font-medium mb-2">Edit Item</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount Needed</label>
              <input
                type="number"
                step="1"
                min="0"
                value={editForm.amountNeeded}
                onChange={(e) => setEditForm({ ...editForm, amountNeeded: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setAction(null);
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                size="sm"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddThingForm({ onSuccess, userId, groupId }: { onSuccess: () => void; userId: string; groupId: string }) {
  const [formData, setFormData] = useState({
    name: '',
    amountNeeded: '',
    description: '',
    sharedWith: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.amountNeeded) {
      return;
    }

    try {
      // TODO: Implement add thing action
      console.log('Adding thing:', formData);

      // Add to Firestore
      const result = await addThingToBuy({
        name: formData.name,
        amountNeeded: parseFloat(formData.amountNeeded),
        description: formData.description,
        addedBy: userId,
        groupId: groupId,
        sharedWith: formData.sharedWith,
        status: 'pending'
      });

      if (result.success) {
        console.log('Thing added with ID:', result.id);
        onSuccess();

        // Reset form
        setFormData({
          name: '',
          amountNeeded: '',
          description: '',
          sharedWith: []
        });
      } else {
        console.error('Failed to add thing:', result.error);
      }
    } catch (error) {
      console.error('Failed to add thing:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Thing Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="Enter thing name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amount Needed</label>
        <input
          type="number"
          step="1"
          min="0"
          value={formData.amountNeeded}
          onChange={(e) => setFormData({ ...formData, amountNeeded: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded-md"
          rows={3}
          placeholder="Add any additional details..."
        />
      </div>

      <Button type="submit" className="w-full">
        Add Thing to Buy
      </Button>
    </form>
  );
}
