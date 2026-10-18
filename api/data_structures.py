
import heapq
from collections import deque


class Queue:
    def __init__(self):
        self.items = deque()

    def enqueue(self, patient):
        self.items.append(patient)

    def dequeue(self):
        if self.items:
            return self.items.popleft()
        return None

    def is_empty(self):
        return len(self.items) == 0


class PriorityQueue:
    def __init__(self):
        self.levels = {}
        self.priorities = []

    def enqueue(self, patient):
        level = patient["emergency_level"]

        if level not in self.levels:
            self.levels[level] = Queue()
            heapq.heappush(self.priorities, level)

        self.levels[level].enqueue(patient)

    def dequeue(self):
        while self.priorities:
            level = self.priorities[0]
            patient = self.levels[level].dequeue()

            if self.levels[level].is_empty():
                heapq.heappop(self.priorities)
                del self.levels[level]

            if patient is not None and patient["status"] == "Waiting":
                return patient

        return None

    def is_empty(self):
        return len(self.priorities) == 0


class BSTNode:
    def __init__(self, patient):
        self.patient = patient
        self.left = None
        self.right = None


class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, patient):
        self.root = self._insert(self.root, patient)

    def _insert(self, node, patient):
        if node is None:
            return BSTNode(patient)

        if patient["patient_id"] < node.patient["patient_id"]:
            node.left = self._insert(node.left, patient)
        elif patient["patient_id"] > node.patient["patient_id"]:
            node.right = self._insert(node.right, patient)

        return node

    def search(self, patient_id):
        node = self.root

        while node:
            if patient_id == node.patient["patient_id"]:
                return node.patient
            elif patient_id < node.patient["patient_id"]:
                node = node.left
            else:
                node = node.right

        return None


class HistoryNode:
    def __init__(self, patient):
        self.patient = patient
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, patient):
        new_node = HistoryNode(patient)

        if self.head is None:
            self.head = new_node
            return

        current = self.head
        while current.next:
            current = current.next

        current.next = new_node

    def get_all(self):
        patients = []
        current = self.head

        while current:
            patients.append(current.patient)
            current = current.next

        return patients
